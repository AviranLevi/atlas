// External
import type { Context } from 'hono';

// Shared
import type { CreateAgent, UpdateAgent } from '@my-agents/shared';

// Services
import { agentsService } from '../services/index.js';

/** Lists all agents. */
export async function listAgents(c: Context) {
  const agents = await agentsService.list();
  return c.json(agents);
}

/** Returns an agent by ID. */
export async function getAgent(c: Context) {
  const agent = await agentsService.getById(c.req.param('id')!);
  return c.json(agent);
}

/** Creates a new agent. */
export async function createAgent(c: Context) {
  const data = (c.req as any).valid('json') as CreateAgent;
  const agent = await agentsService.create(data);
  return c.json(agent, 201);
}

/** Updates an agent by ID. */
export async function updateAgent(c: Context) {
  const agent = await agentsService.update(c.req.param('id')!, (c.req as any).valid('json') as UpdateAgent);
  return c.json(agent);
}

/** Deletes an agent by ID. */
export async function deleteAgent(c: Context) {
  await agentsService.delete(c.req.param('id')!);
  return c.body(null, 204);
}
