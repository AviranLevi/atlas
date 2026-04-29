// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateApiKeySchema } from '@atlas/shared';

// Controllers
import {
  bootstrapApiKey,
  createApiKey,
  deleteApiKey,
  listApiKeys,
  setupApiKey,
} from '../controllers/auth.controller.js';

// Lib
import { localOnly } from '../lib/local-only.js';

/**
 * Every route here is unauthenticated (the `app.use('/api/v1/*', ...)` rule
 * in `index.ts` exempts `/api/v1/auth/*` from `authMiddleware`). Without
 * `localOnly`, anyone on the same network could mint or revoke keys against
 * a default `0.0.0.0`-bound dev server. `localOnly` enforces a localhost
 * Origin + Host so these endpoints are only reachable from the local browser.
 */
export const authRoute = new Hono()
  .post('/bootstrap', localOnly, bootstrapApiKey)
  .post('/setup', localOnly, zValidator('json', CreateApiKeySchema), setupApiKey)
  .get('/keys', localOnly, listApiKeys)
  .post('/keys', localOnly, zValidator('json', CreateApiKeySchema), createApiKey)
  .delete('/keys/:id', localOnly, deleteApiKey);
