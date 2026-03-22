import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { McpConfigFormat } from './executor.types.js';

// __dirname → packages/server/src/executors
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Monorepo root: go up 4 levels from packages/server/src/executors → root
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

// Absolute path to the MCP server entry point (never rely on cwd for this)
const MCP_ENTRY = path.join(PROJECT_ROOT, 'packages/server/src/mcp.ts');

// Store configs next to where the server runs
const MCP_CONFIG_DIR = path.join(PROJECT_ROOT, 'data', 'mcp-configs');

export function generateMcpConfig(
  workspaceId: string,
  format: McpConfigFormat,
): string | undefined {
  if (format === 'none') return undefined;

  fs.mkdirSync(MCP_CONFIG_DIR, { recursive: true });

  // Use absolute path for the MCP entry point so it works regardless of cwd
  const mcpServerEntry = {
    command: 'npx',
    args: ['tsx', MCP_ENTRY],
    cwd: PROJECT_ROOT,
  };

  // Log the generated config for debugging
  console.error(`[MCP Config] workspace=${workspaceId} cwd=${PROJECT_ROOT} entry=${MCP_ENTRY}`);

  let config: Record<string, unknown>;

  switch (format) {
    case 'claude':
      config = { mcpServers: { 'my-agents': mcpServerEntry } };
      break;
    case 'cursor':
      config = { mcpServers: { 'my-agents': mcpServerEntry } };
      break;
    case 'generic-json':
      config = { mcpServers: { 'my-agents': mcpServerEntry } };
      break;
    default:
      return undefined;
  }

  const configPath = path.join(MCP_CONFIG_DIR, `${workspaceId}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

export function removeMcpConfig(workspaceId: string): void {
  const configPath = path.join(MCP_CONFIG_DIR, `${workspaceId}.json`);
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}
