// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateAgentProviderSchema, UpdateAgentProviderSchema } from '@my-agents/shared';

// Controllers
import {
  listAgentProviders,
  getAgentProvider,
  createAgentProvider,
  updateAgentProvider,
  deleteAgentProvider,
  testAgentProviderConnection,
} from '../controllers/agent-providers.controller.js';

export const agentProvidersRoute = new Hono()
  .get('/', listAgentProviders)
  .get('/:id', getAgentProvider)
  .post('/', zValidator('json', CreateAgentProviderSchema), createAgentProvider)
  .put('/:id', zValidator('json', UpdateAgentProviderSchema), updateAgentProvider)
  .delete('/:id', deleteAgentProvider)
  .post('/:id/test', testAgentProviderConnection);
