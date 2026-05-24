// External
import { Hono } from 'hono';
import { z } from 'zod';

// Shared
import { CreateAutomationSchema, UpdateAutomationSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createAutomation,
  deleteAutomation,
  getAutomation,
  listAutomationTemplates,
  listAutomations,
  runAutomation,
  updateAutomation,
} from '../controllers/automations.controller.js';

const RunAutomationSchema = z.object({
  projectId: z.string().uuid(),
});

export const automationsRoute = new Hono()
  .get('/', listAutomations)
  .get('/templates', listAutomationTemplates)
  .get('/:id', getAutomation)
  .post('/', zValidator('json', CreateAutomationSchema), createAutomation)
  .put('/:id', zValidator('json', UpdateAutomationSchema), updateAutomation)
  .delete('/:id', deleteAutomation)
  .post('/:id/run', zValidator('json', RunAutomationSchema), runAutomation);
