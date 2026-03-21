import { Hono } from 'hono';

const MCP_HTTP_PORT = 3101;
const MCP_SSE_URL = `http://localhost:${MCP_HTTP_PORT}/sse`;
const MCP_MESSAGES_URL = `http://localhost:${MCP_HTTP_PORT}/messages`;

export const mcpConfigRoute = new Hono().get('/connection-info', async (c) => {
  const cursorConfig = {
    mcpServers: {
      'my-agents': {
        url: MCP_SSE_URL,
      },
    },
  };

  const claudeDesktopConfig = {
    mcpServers: {
      'my-agents': {
        transport: 'sse',
        url: MCP_SSE_URL,
      },
    },
  };

  const stdioConfig = {
    mcpServers: {
      'my-agents': {
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
});
