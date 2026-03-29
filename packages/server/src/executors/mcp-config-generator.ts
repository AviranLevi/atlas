import fs from 'fs';
import os from 'os';
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

// Gemini CLI settings file path
const GEMINI_SETTINGS_PATH = path.join(os.homedir(), '.gemini', 'settings.json');

export function generateMcpConfig(
  workspaceId: string,
  format: McpConfigFormat,
): string | undefined {
  if (format === 'none') return undefined;

  // Use absolute path for the MCP entry point so it works regardless of cwd
  const mcpServerEntry = {
    command: 'npx',
    args: ['tsx', MCP_ENTRY],
    cwd: PROJECT_ROOT,
  };

  // Log the generated config for debugging
  console.error(`[MCP Config] workspace=${workspaceId} cwd=${PROJECT_ROOT} entry=${MCP_ENTRY}`);

  if (format === 'gemini') {
    // Gemini CLI reads MCP config from ~/.gemini/settings.json — merge our server in
    fs.mkdirSync(path.dirname(GEMINI_SETTINGS_PATH), { recursive: true });
    let settings: Record<string, unknown> = {};
    if (fs.existsSync(GEMINI_SETTINGS_PATH)) {
      try { settings = JSON.parse(fs.readFileSync(GEMINI_SETTINGS_PATH, 'utf8')); } catch { /* ignore */ }
    }
    const mcpServers = (settings.mcpServers as Record<string, unknown>) ?? {};
    mcpServers['atlas'] = mcpServerEntry;
    settings.mcpServers = mcpServers;
    fs.writeFileSync(GEMINI_SETTINGS_PATH, JSON.stringify(settings, null, 2));
    // Return the settings path so cleanup knows where to look
    return GEMINI_SETTINGS_PATH;
  }

  fs.mkdirSync(MCP_CONFIG_DIR, { recursive: true });

  let config: Record<string, unknown>;
  switch (format) {
    case 'claude':
    case 'cursor':
    case 'generic-json':
      config = { mcpServers: { 'atlas': mcpServerEntry } };
      break;
    default:
      return undefined;
  }

  const configPath = path.join(MCP_CONFIG_DIR, `${workspaceId}.json`);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

export function removeMcpConfig(workspaceId: string, format?: McpConfigFormat): void {
  if (format === 'gemini') {
    // Remove our 'atlas' entry from ~/.gemini/settings.json
    if (!fs.existsSync(GEMINI_SETTINGS_PATH)) return;
    try {
      const settings = JSON.parse(fs.readFileSync(GEMINI_SETTINGS_PATH, 'utf8'));
      if (settings.mcpServers) {
        delete settings.mcpServers['atlas'];
        fs.writeFileSync(GEMINI_SETTINGS_PATH, JSON.stringify(settings, null, 2));
      }
    } catch { /* ignore */ }
    return;
  }
  const configPath = path.join(MCP_CONFIG_DIR, `${workspaceId}.json`);
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}
