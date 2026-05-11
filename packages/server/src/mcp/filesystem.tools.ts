// External
import fs from 'node:fs';
import path from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Services
import { projectsService } from '../services/index.js';

const MAX_FILE_BYTES = 100_000; // 100 KB cap — avoids sending huge build artifacts

function isPathInsideRoot(root: string, target: string): boolean {
  const rel = path.relative(root, target);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

function listDirectory(dirPath: string, maxDepth: number, currentDepth = 0): unknown {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return { error: 'Path does not exist or is not a directory' };
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '__pycache__')
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((e) => {
      const entry: Record<string, unknown> = {
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
      };
      if (e.isDirectory() && currentDepth < maxDepth - 1) {
        entry.children = listDirectory(path.join(dirPath, e.name), maxDepth, currentDepth + 1);
      }
      return entry;
    });
}

export function registerFilesystemTools(server: McpServer): void {
  server.registerTool(
    'browse_project_files',
    {
      description:
        'Browse the directory tree of a project. Returns a nested list of files and folders. ' +
        'Use this to navigate the project structure before reading specific files.',
      inputSchema: z.object({
        projectId: z.string().uuid().describe('The project UUID'),
        relativePath: z.string().optional().describe('Path relative to project root (default: ".")'),
        maxDepth: z.number().int().min(1).max(5).optional().describe('Directory depth to expand (default: 1)'),
      }),
    },
    async ({ projectId, relativePath, maxDepth }) => {
      const project = await projectsService.getById(projectId);
      if (!project.localPath) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Project has no local path configured' }) }],
        };
      }

      const root = path.resolve(project.localPath);
      const target = path.resolve(root, relativePath ?? '.');

      if (!isPathInsideRoot(root, target)) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Path traversal not allowed' }) }] };
      }

      const result = listDirectory(target, maxDepth ?? 1);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    'read_file',
    {
      description:
        'Read the contents of a file in a project. ' +
        'Files larger than 100 KB are rejected — use a more targeted path.',
      inputSchema: z.object({
        projectId: z.string().uuid().describe('The project UUID'),
        relativePath: z.string().describe('Path to the file, relative to project root'),
      }),
    },
    async ({ projectId, relativePath }) => {
      const project = await projectsService.getById(projectId);
      if (!project.localPath) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Project has no local path configured' }) }],
        };
      }

      const root = path.resolve(project.localPath);
      const fullPath = path.resolve(root, relativePath);

      if (!isPathInsideRoot(root, fullPath)) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ error: 'Path traversal not allowed' }) }] };
      }

      if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: `File not found: ${relativePath}` }) }],
        };
      }

      const stat = fs.statSync(fullPath);
      if (stat.size > MAX_FILE_BYTES) {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                error: `File too large (${Math.round(stat.size / 1024)} KB). Read a more targeted path.`,
              }),
            },
          ],
        };
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      return { content: [{ type: 'text' as const, text: content }] };
    },
  );
}
