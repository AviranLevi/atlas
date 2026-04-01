// External
import { Hono } from 'hono';

// Shared
import { CreatePhaseSchema, ReorderPhaseSchema, UpdatePhaseSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  createPhase,
  deletePhase,
  getPhase,
  listPhases,
  reorderPhase,
  updatePhase,
} from '../controllers/phases.controller.js';

export const phasesRoute = new Hono()
  .get('/', listPhases)
  .get('/:id', getPhase)
  .post('/', zValidator('json', CreatePhaseSchema), createPhase)
  .put('/:id', zValidator('json', UpdatePhaseSchema), updatePhase)
  .delete('/:id', deletePhase)
  .post('/:id/reorder', zValidator('json', ReorderPhaseSchema), reorderPhase);
