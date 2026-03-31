// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateMcpServerSchema, UpdateMcpServerSchema } from '@atlas/shared';

// Controllers
import {
  listMcpServers,
  getMcpServer,
  createMcpServer,
  updateMcpServer,
  deleteMcpServer,
} from '../controllers/mcp-servers.controller.js';

export const mcpServersRoute = new Hono()
  .get('/', listMcpServers)
  .get('/:id', getMcpServer)
  .post('/', zValidator('json', CreateMcpServerSchema), createMcpServer)
  .put('/:id', zValidator('json', UpdateMcpServerSchema), updateMcpServer)
  .delete('/:id', deleteMcpServer);
