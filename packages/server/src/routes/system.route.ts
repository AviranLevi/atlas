// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { ResetDatabaseSchema } from '@atlas/shared';

// Controllers
import { exportDatabase, getSystemInfo, resetDatabase } from '../controllers/system.controller.js';

export const systemRoute = new Hono()
  .get('/info', getSystemInfo)
  .get('/export', exportDatabase)
  .post('/reset', zValidator('json', ResetDatabaseSchema), resetDatabase);
