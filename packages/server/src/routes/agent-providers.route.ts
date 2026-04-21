// External
import { Hono } from 'hono';

// Shared
import { CreateAgentProviderSchema, ListModelsInlineSchema, UpdateAgentProviderSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createAgentProvider,
  deleteAgentProvider,
  getAgentProvider,
  listAgentProviderModels,
  listAgentProviders,
  listModelsInline,
  testAgentProviderConnection,
  updateAgentProvider,
} from '../controllers/agent-providers.controller.js';

export const agentProvidersRoute = new Hono()
  .get('/', listAgentProviders)
  .post('/models', zValidator('json', ListModelsInlineSchema), listModelsInline)
  .post('/', zValidator('json', CreateAgentProviderSchema), createAgentProvider)
  .get('/:id', getAgentProvider)
  .get('/:id/models', listAgentProviderModels)
  .put('/:id', zValidator('json', UpdateAgentProviderSchema), updateAgentProvider)
  .delete('/:id', deleteAgentProvider)
  .post('/:id/test', testAgentProviderConnection);
