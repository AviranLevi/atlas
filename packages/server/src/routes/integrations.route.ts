// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { UpsertIntegrationSchema, TestSupermemorySchema } from '@atlas/shared';

// Controllers
import {
  listIntegrations,
  getIntegration,
  upsertIntegration,
  testSupermemoryConnection,
} from '../controllers/integrations.controller.js';

export const integrationsRoute = new Hono()
  .get('/', listIntegrations)
  .get('/:name', getIntegration)
  .put('/:name', zValidator('json', UpsertIntegrationSchema), upsertIntegration)
  .post('/supermemory/test', zValidator('json', TestSupermemorySchema), testSupermemoryConnection);
