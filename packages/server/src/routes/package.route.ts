// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { AtlasPackageSchema, ImportRequestSchema } from '@atlas/shared';

// Controllers
import {
  exportAgent,
  exportSkill,
  exportRule,
  previewImport,
  executeImport,
} from '../controllers/package.controller.js';

export const packageRoute = new Hono()
  .get('/export/agent/:id', exportAgent)
  .get('/export/skill/:id', exportSkill)
  .get('/export/rule/:id', exportRule)
  .post('/import/preview', zValidator('json', AtlasPackageSchema), previewImport)
  .post('/import', zValidator('json', ImportRequestSchema), executeImport);
