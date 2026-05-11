// External
import type { Context } from 'hono';

const MCP_HTTP_PORT = process.env.MCP_PORT || '3101';
const MCP_SSE_URL = `http://localhost:${MCP_HTTP_PORT}/sse`;
const MCP_MESSAGES_URL = `http://localhost:${MCP_HTTP_PORT}/messages`;

/** Returns MCP connection config for Cursor, Claude Desktop, and stdio transports. */
export async function getMcpConnectionInfo(c: Context) {
  const cursorConfig = {
    mcpServers: {
      atlas: {
        url: MCP_SSE_URL,
        headers: {
          Authorization: 'Bearer YOUR_ATLAS_API_KEY',
        },
      },
    },
  };

  const claudeDesktopConfig = {
    mcpServers: {
      atlas: {
        transport: 'sse',
        url: MCP_SSE_URL,
        headers: {
          Authorization: 'Bearer YOUR_ATLAS_API_KEY',
        },
      },
    },
  };

  const stdioConfig = {
    mcpServers: {
      atlas: {
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
      cursor: 'Add to ~/.cursor/mcp.json. Replace YOUR_ATLAS_API_KEY with a key from Atlas → Settings → API Keys.',
      claude:
        'In Claude Desktop → Settings → Developer → Edit Config. Replace YOUR_ATLAS_API_KEY with a key from Atlas → Settings → API Keys.',
      stdio: 'For Claude Code CLI or other stdio-based tools, use the stdioConfig',
    },
  });
}
