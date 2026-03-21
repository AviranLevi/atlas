import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { McpConfigFormat } from './executor.types.js';

const MCP_CONFIG_DIR = path.resolve(process.cwd(), 'data', 'mcp-configs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

export function generateMcpConfig(
  workspaceId: string,
  format: McpConfigFormat,
): string | undefined {
  if (format === 'none') return undefined;

  fs.mkdirSync(MCP_CONFIG_DIR, { recursive: true });

  const mcpServerEntry = {
    command: 'npx',
    args: ['tsx', 'packages/server/src/mcp.ts'],
    cwd: PROJECT_ROOT,
  };

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
