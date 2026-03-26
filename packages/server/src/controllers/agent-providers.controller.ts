// External
import type { Context } from 'hono';

// Shared
import type { CreateAgentProvider, UpdateAgentProvider } from '@atlas/shared';

// Services
import { agentProvidersService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

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
  const data = getValidatedBody<CreateAgentProvider>(c);
  const item = await agentProvidersService.create(data);
  return c.json(item, 201);
}

/** Updates an agent provider by ID. */
export async function updateAgentProvider(c: Context) {
  const item = await agentProvidersService.update(c.req.param('id')!, getValidatedBody<UpdateAgentProvider>(c));
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

/** Lists models available from the provider's API. */
export async function listAgentProviderModels(c: Context) {
  const models = await agentProvidersService.listModels(c.req.param('id')!);
  return c.json(models);
}
