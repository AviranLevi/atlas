// External
import http from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import { registerAllTools } from './mcp/register-all.js';

// Services
import { authService, preferencesService } from './services/index.js';

// Lib
import { logger } from './lib/logger.js';

const MCP_HTTP_PORT = parseInt(process.env.MCP_PORT || '3101', 10);
const DEV_BYPASS = process.env.ATLAS_AUTH_BYPASS === 'true';

/** Preference key controlling whether the MCP server accepts connections. */
export const MCP_ENABLED_PREF = 'mcp.server.enabled';

/** Extracts and validates the Bearer token from a raw HTTP request. Returns false if invalid. */
async function checkAuth(req: http.IncomingMessage, res: http.ServerResponse): Promise<boolean> {
  if (DEV_BYPASS) return true;

  const enabled = await preferencesService.get(MCP_ENABLED_PREF);
  if (enabled !== 'true') {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'MCP server is disabled. Enable it in Atlas Settings.' }));
    return false;
  }

  const header = req.headers['authorization'] ?? '';
  const raw = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!raw) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return false;
  }

  const apiKey = await authService.validateKey(raw);
  if (!apiKey) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return false;
  }

  return true;
}

export function startMcpHttpServer() {
  const mcpServer = new McpServer({
    name: 'atlas',
    version: '0.0.1',
  });

  registerAllTools(mcpServer);

  const sessions = new Map<string, SSEServerTransport>();

  const httpServer = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url ?? '/', `http://localhost:${MCP_HTTP_PORT}`);

    if (req.method === 'GET' && url.pathname === '/sse') {
      if (!(await checkAuth(req, res))) return;

      const transport = new SSEServerTransport('/messages', res);
      sessions.set(transport.sessionId, transport);

      transport.onclose = () => {
        sessions.delete(transport.sessionId);
      };

      await mcpServer.connect(transport);
      await transport.start();
      return;
    }

    if (req.method === 'POST' && url.pathname === '/messages') {
      const sessionId = url.searchParams.get('sessionId');
      if (!sessionId) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing sessionId' }));
        return;
      }
      const transport = sessions.get(sessionId);
      if (!transport) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Session not found' }));
        return;
      }
      await transport.handlePostMessage(req, res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, sessions: sessions.size }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  httpServer.listen(MCP_HTTP_PORT, () => {
    logger.info(`MCP HTTP/SSE server running on http://localhost:${MCP_HTTP_PORT}/sse`);
  });

  return httpServer;
}
