// External
import { Hono } from 'hono';

// Shared
import { TestSupermemorySchema, UpsertIntegrationSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  getIntegration,
  listIntegrations,
  testSupermemoryConnection,
  upsertIntegration,
} from '../controllers/integrations.controller.js';

export const integrationsRoute = new Hono()
  .get('/', listIntegrations)
  .get('/:name', getIntegration)
  .put('/:name', zValidator('json', UpsertIntegrationSchema), upsertIntegration)
  .post('/supermemory/test', zValidator('json', TestSupermemorySchema), testSupermemoryConnection);
