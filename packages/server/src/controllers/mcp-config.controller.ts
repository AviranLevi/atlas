// External
import type { Context } from 'hono';

const MCP_HTTP_PORT = process.env.MCP_PORT || '3101';
const MCP_SSE_URL = `http://localhost:${MCP_HTTP_PORT}/sse`;
const MCP_MESSAGES_URL = `http://localhost:${MCP_HTTP_PORT}/messages`;

/** Returns MCP connection config for Cursor, Claude Desktop, and stdio transports. */
export async function getMcpConnectionInfo(c: Context) {
  const cursorConfig = {
    mcpServers: {
      'atlas': {
        url: MCP_SSE_URL,
      },
    },
  };

  const claudeDesktopConfig = {
    mcpServers: {
      'atlas': {
        transport: 'sse',
        url: MCP_SSE_URL,
      },
    },
  };

  const stdioConfig = {
    mcpServers: {
      'atlas': {
        command: 'npx',
        args: ['tsx', 'packages/server/src/mcp.ts'],
      },
    },
  };

  return c.json({
    sseUrl: MCP_SSE_URL,
    messagesUrl: MCP_MESSAGES_URL,
    cursorConfig,
    claudeDesktopConfig,
    stdioConfig,
    instructions: {
      cursor: 'Add the cursorConfig to your ~/.cursor/mcp.json file (or merge with existing)',
      claude: 'In Claude Desktop, go to Settings > Developer > Edit Config and add the claudeDesktopConfig',
      stdio: 'For Claude Code CLI or other stdio-based tools, use the stdioConfig',
    },
  });
}
