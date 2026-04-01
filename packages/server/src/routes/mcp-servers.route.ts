// External
import { Hono } from 'hono';

// Shared
import { CreateMcpServerSchema, UpdateMcpServerSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createMcpServer,
  deleteMcpServer,
  getMcpServer,
  listMcpServers,
  updateMcpServer,
} from '../controllers/mcp-servers.controller.js';

export const mcpServersRoute = new Hono()
  .get('/', listMcpServers)
  .get('/:id', getMcpServer)
  .post('/', zValidator('json', CreateMcpServerSchema), createMcpServer)
  .put('/:id', zValidator('json', UpdateMcpServerSchema), updateMcpServer)
  .delete('/:id', deleteMcpServer);
