// External
import { z } from 'zod';
import path from 'node:path';

// Lib
import { isResolvedPathInsideRoot } from '../../fs/safe-path.js';
import { listDirectory } from '../../fs/list-directory.js';
import { readFileSafely } from '../../fs/read-file-safely.js';
import { makeChatTool } from './registry.js';

export const browseProjectFilesTool = makeChatTool({
  name: 'browse_project_files',
  description: 'List files and directories at a given path within the project. Use to explore the project structure.',
  mutating: false,
  inputSchema: z.object({
    relativePath: z.string().optional().describe('Path relative to project root. Use "." or empty string for root.'),
    maxDepth: z.number().int().min(0).optional().describe('How many levels deep to list. Default 1.'),
  }),
  handler: (input, context) => {
    if (!context.projectLocalPath) return { error: 'No project local path configured' };
    const root = path.resolve(context.projectLocalPath);
    const fullPath = path.resolve(root, input.relativePath || '.');
    if (!isResolvedPathInsideRoot(root, fullPath)) return { error: 'Path traversal not allowed' };
    return listDirectory(fullPath, input.maxDepth ?? 1);
  },
});

export const readFileTool = makeChatTool({
  name: 'read_file',
  description:
    'Read the contents of a file within the project. Use after browse_project_files to inspect specific files.',
  mutating: false,
  inputSchema: z.object({
    relativePath: z
      .string()
      .min(1)
      .describe('Path to the file relative to the project root (e.g. "src/auth/auth.service.ts").'),
  }),
  handler: (input, context) => {
    if (!context.projectLocalPath) return { error: 'No project local path configured' };
    return readFileSafely(path.resolve(context.projectLocalPath), input.relativePath);
  },
});

export const filesystemTools = [browseProjectFilesTool, readFileTool];
