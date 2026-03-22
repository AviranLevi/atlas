// External
import { Hono } from 'hono';

// Controllers
import { getMcpConnectionInfo } from '../controllers/mcp-config.controller.js';

export const mcpConfigRoute = new Hono().get('/connection-info', getMcpConnectionInfo);
