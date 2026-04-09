// External
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Services
import { mcpServersService } from '../services/index.js';

// Executors
import type { McpConfigFormat } from './executor.types.js';

// __dirname → packages/server/src/executors
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Monorepo root: go up 4 levels from packages/server/src/executors → root
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

// Absolute path to the MCP server TypeScript entry point.
const TS_MCP_ENTRY = path.join(PROJECT_ROOT, 'packages/server/src/mcp.ts');

// Local tsx binary — avoids the `npx` network-lookup overhead on every chat message.
// pnpm workspaces ensures tsx is always present in packages/server/node_modules.
const LOCAL_TSX = path.join(PROJECT_ROOT, 'packages/server/node_modules/tsx/dist/cli.mjs');

// Store configs next to where the server runs
const MCP_CONFIG_DIR = path.join(PROJECT_ROOT, 'data', 'mcp-configs');

// Gemini CLI settings file path
const GEMINI_SETTINGS_PATH = path.join(os.homedir(), '.gemini', 'settings.json');

async function buildMcpServers(atlasEntry: Record<string, unknown>): Promise<Record<string, unknown>> {
  const servers: Record<string, unknown> = { atlas: atlasEntry };
  try {
    const userServers = await mcpServersService.listEnabled();
    for (const s of userServers) {
      try {
        const entry: Record<string, unknown> = { command: s.command };
        if (s.args) entry.args = JSON.parse(s.args);
        if (s.env) entry.env = JSON.parse(s.env);
        servers[s.name] = entry;
      } catch {
        console.error(`[MCP Config] Skipping server "${s.name}": malformed args/env JSON`);
      }
    }
  } catch (err) {
    console.error('[MCP Config] Failed to load user MCP servers:', err instanceof Error ? err.message : err);
  }
  return servers;
}

/** Write content to a file only if it differs from the current content — avoids redundant disk writes. */
function writeIfChanged(filePath: string, content: string): void {
  try {
    if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === content) return;
  } catch {
    /* fall through and write */
  }
  fs.writeFileSync(filePath, content);
}

export async function generateMcpConfig(workspaceId: string, format: McpConfigFormat): Promise<string | undefined> {
  if (format === 'none') return undefined;

  // Use the local tsx binary to run the TypeScript MCP source directly.
  // This avoids the npx network-lookup overhead while still running the TypeScript source.
  const usesLocalTsx = fs.existsSync(LOCAL_TSX);
  const mcpServerEntry = usesLocalTsx
    ? { command: 'node', args: [LOCAL_TSX, TS_MCP_ENTRY] }
    : { command: 'npx', args: ['tsx', TS_MCP_ENTRY], cwd: PROJECT_ROOT };

  console.error(`[MCP Config] workspace=${workspaceId} tsx=${usesLocalTsx ? 'local' : 'npx'} entry=${TS_MCP_ENTRY}`);

  if (format === 'gemini') {
    // Gemini CLI reads MCP config from ~/.gemini/settings.json — merge our server in
    fs.mkdirSync(path.dirname(GEMINI_SETTINGS_PATH), { recursive: true });
    let settings: Record<string, unknown> = {};
    if (fs.existsSync(GEMINI_SETTINGS_PATH)) {
      try {
        settings = JSON.parse(fs.readFileSync(GEMINI_SETTINGS_PATH, 'utf8'));
      } catch {
        /* ignore */
      }
    }
    const mcpServers = (settings.mcpServers as Record<string, unknown>) ?? {};
    const allServers = await buildMcpServers(mcpServerEntry);
    Object.assign(mcpServers, allServers);
    settings.mcpServers = mcpServers;
    // Only write if the content actually changed to avoid unnecessary disk I/O
    writeIfChanged(GEMINI_SETTINGS_PATH, JSON.stringify(settings, null, 2));
    // Return the settings path so cleanup knows where to look
    return GEMINI_SETTINGS_PATH;
  }

  fs.mkdirSync(MCP_CONFIG_DIR, { recursive: true });

  let config: Record<string, unknown>;
  switch (format) {
    case 'claude':
    case 'cursor':
    case 'generic-json': {
      const allServers = await buildMcpServers(mcpServerEntry);
      config = { mcpServers: allServers };
      break;
    }
    default:
      return undefined;
  }

  const configPath = path.join(MCP_CONFIG_DIR, `${workspaceId}.json`);
  writeIfChanged(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

export function removeMcpConfig(workspaceId: string, format?: McpConfigFormat): void {
  if (format === 'gemini') {
    // Remove our 'atlas' entry from ~/.gemini/settings.json
    if (!fs.existsSync(GEMINI_SETTINGS_PATH)) return;
    try {
      const settings = JSON.parse(fs.readFileSync(GEMINI_SETTINGS_PATH, 'utf8'));
      if (settings.mcpServers) {
        delete settings.mcpServers.atlas;
        fs.writeFileSync(GEMINI_SETTINGS_PATH, JSON.stringify(settings, null, 2));
      }
    } catch {
      /* ignore */
    }
    return;
  }
  const configPath = path.join(MCP_CONFIG_DIR, `${workspaceId}.json`);
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}
