// External
import { Hono } from 'hono';

// Shared
import { ResetDatabaseSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import { exportDatabase, getSystemInfo, resetDatabase } from '../controllers/system.controller.js';

export const systemRoute = new Hono()
  .get('/info', getSystemInfo)
  .get('/export', exportDatabase)
  .post('/reset', zValidator('json', ResetDatabaseSchema), resetDatabase);
