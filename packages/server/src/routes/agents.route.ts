// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateAgentSchema, UpdateAgentSchema } from '@my-agents/shared';

// Controllers
import { listAgents, getAgent, createAgent, updateAgent, deleteAgent } from '../controllers/agents.controller.js';

export const agentsRoute = new Hono()
  .get('/', listAgents)
  .get('/:id', getAgent)
  .post('/', zValidator('json', CreateAgentSchema), createAgent)
  .put('/:id', zValidator('json', UpdateAgentSchema), updateAgent)
  .delete('/:id', deleteAgent);
