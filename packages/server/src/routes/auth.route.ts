// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateApiKeySchema } from '@atlas/shared';

// Controllers
import { createApiKey, deleteApiKey, listApiKeys, setupApiKey } from '../controllers/auth.controller.js';

export const authRoute = new Hono()
  .post('/setup', zValidator('json', CreateApiKeySchema), setupApiKey)
  .get('/keys', listApiKeys)
  .post('/keys', zValidator('json', CreateApiKeySchema), createApiKey)
  .delete('/keys/:id', deleteApiKey);
