// External
import type { Context } from 'hono';

// Shared
import type { CreateMcpServer, UpdateMcpServer } from '@atlas/shared';

// Services
import { mcpServersService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Lists all MCP servers. */
export async function listMcpServers(c: Context) {
  const items = await mcpServersService.list();
  return c.json(items);
}

/** Returns an MCP server by ID. */
export async function getMcpServer(c: Context) {
  const item = await mcpServersService.getById(c.req.param('id')!);
  return c.json(item);
}

/** Creates a new MCP server. */
export async function createMcpServer(c: Context) {
  const data = getValidatedBody<CreateMcpServer>(c);
  const item = await mcpServersService.create(data);
  return c.json(item, 201);
}

/** Updates an MCP server by ID. */
export async function updateMcpServer(c: Context) {
  const item = await mcpServersService.update(c.req.param('id')!, getValidatedBody<UpdateMcpServer>(c));
  return c.json(item);
}

/** Deletes an MCP server by ID. */
export async function deleteMcpServer(c: Context) {
  await mcpServersService.delete(c.req.param('id')!);
  return c.body(null, 204);
}
