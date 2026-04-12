// External
import { Hono } from 'hono';
import { z } from 'zod';

// Shared
import { AtlasPackageSchema, ImportRequestSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

const ExportCollectionBodySchema = z.object({
  skillIds: z.array(z.string().uuid()).default([]),
  ruleIds: z.array(z.string().uuid()).default([]),
  agentIds: z.array(z.string().uuid()).default([]),
});

// Controllers
import {
  applyImport,
  exportAgent,
  exportCollection,
  exportRule,
  exportSkill,
  previewImport,
} from '../controllers/package.controller.js';

export const packageRoute = new Hono()
  .get('/export/skill/:id', exportSkill)
  .get('/export/rule/:id', exportRule)
  .get('/export/agent/:id', exportAgent)
  .post('/export/collection', zValidator('json', ExportCollectionBodySchema), exportCollection)
  .post('/import/preview', zValidator('json', AtlasPackageSchema), previewImport)
  .post('/import/apply', zValidator('json', ImportRequestSchema), applyImport);
