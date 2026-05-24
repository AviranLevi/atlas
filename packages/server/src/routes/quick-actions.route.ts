// External
import { Hono } from 'hono';
import { z } from 'zod';

// Shared
import { CreateQuickActionSchema, UpdateQuickActionSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createQuickAction,
  deleteQuickAction,
  getQuickAction,
  listQuickActionTemplates,
  listQuickActions,
  runQuickAction,
  updateQuickAction,
} from '../controllers/quick-actions.controller.js';

const RunQuickActionSchema = z.object({
  projectId: z.string().uuid(),
});

export const quickActionsRoute = new Hono()
  .get('/', listQuickActions)
  .get('/templates', listQuickActionTemplates)
  .get('/:id', getQuickAction)
  .post('/', zValidator('json', CreateQuickActionSchema), createQuickAction)
  .put('/:id', zValidator('json', UpdateQuickActionSchema), updateQuickAction)
  .delete('/:id', deleteQuickAction)
  .post('/:id/run', zValidator('json', RunQuickActionSchema), runQuickAction);
