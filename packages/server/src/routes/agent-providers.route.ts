// External
import { Hono } from 'hono';

// Shared
import { CreateAgentProviderSchema, UpdateAgentProviderSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createAgentProvider,
  deleteAgentProvider,
  getAgentProvider,
  listAgentProviderModels,
  listAgentProviders,
  testAgentProviderConnection,
  updateAgentProvider,
} from '../controllers/agent-providers.controller.js';

export const agentProvidersRoute = new Hono()
  .get('/', listAgentProviders)
  .get('/:id', getAgentProvider)
  .get('/:id/models', listAgentProviderModels)
  .post('/', zValidator('json', CreateAgentProviderSchema), createAgentProvider)
  .put('/:id', zValidator('json', UpdateAgentProviderSchema), updateAgentProvider)
  .delete('/:id', deleteAgentProvider)
  .post('/:id/test', testAgentProviderConnection);
