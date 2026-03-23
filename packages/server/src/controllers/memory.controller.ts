// External
import type { Context } from 'hono';

// Shared
import type { CreateMemory, UpdateMemory } from '@my-agents/shared';

// Services
import { memoryService } from '../services/index.js';

/** Lists memory entries, optionally filtered by type, scope, or projectId. */
export async function listMemory(c: Context) {
  const type = c.req.query('type');
  const scope = c.req.query('scope');
  const projectId = c.req.query('projectId');
  const memory = await memoryService.list({ type, scope, projectId });
  return c.json(memory);
}

/** Returns a memory entry by ID. */
export async function getMemory(c: Context) {
  const mem = await memoryService.getById(c.req.param('id')!);
  return c.json(mem);
}

/** Creates a new memory entry. */
export async function createMemory(c: Context) {
  const data = (c.req as any).valid('json') as CreateMemory;
  const mem = await memoryService.create(data);
  return c.json(mem, 201);
}

/** Updates a memory entry by ID. */
export async function updateMemory(c: Context) {
  const mem = await memoryService.update(c.req.param('id')!, (c.req as any).valid('json') as UpdateMemory);
  return c.json(mem);
}

/** Deletes a memory entry by ID. */
export async function deleteMemory(c: Context) {
  await memoryService.delete(c.req.param('id')!);
  return c.body(null, 204);
}
