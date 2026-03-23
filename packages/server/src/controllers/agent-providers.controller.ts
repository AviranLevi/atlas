// External
import type { Context } from 'hono';

// Shared
import type { CreateAgentProvider, UpdateAgentProvider } from '@my-agents/shared';

// Services
import { agentProvidersService } from '../services/index.js';

/** Lists all agent providers. */
export async function listAgentProviders(c: Context) {
  const items = await agentProvidersService.list();
  return c.json(items);
}

/** Returns an agent provider by ID. */
export async function getAgentProvider(c: Context) {
  const item = await agentProvidersService.getById(c.req.param('id')!);
  return c.json(item);
}

/** Creates a new agent provider. */
export async function createAgentProvider(c: Context) {
  const data = (c.req as any).valid('json') as CreateAgentProvider;
  const item = await agentProvidersService.create(data);
  return c.json(item, 201);
}

/** Updates an agent provider by ID. */
export async function updateAgentProvider(c: Context) {
  const item = await agentProvidersService.update(c.req.param('id')!, (c.req as any).valid('json') as UpdateAgentProvider);
  return c.json(item);
}

/** Deletes an agent provider by ID. */
export async function deleteAgentProvider(c: Context) {
  await agentProvidersService.delete(c.req.param('id')!);
  return c.body(null, 204);
}

/** Tests the connection for an agent provider. */
export async function testAgentProviderConnection(c: Context) {
  const result = await agentProvidersService.testConnection(c.req.param('id')!);
  return c.json(result);
}
