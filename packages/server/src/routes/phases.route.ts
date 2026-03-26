import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreatePhaseSchema, UpdatePhaseSchema, ReorderPhaseSchema } from '@atlas/shared';
import {
  listPhases,
  getPhase,
  createPhase,
  updatePhase,
  deletePhase,
  reorderPhase,
} from '../controllers/phases.controller.js';

export const phasesRoute = new Hono()
  .get('/', listPhases)
  .get('/:id', getPhase)
  .post('/', zValidator('json', CreatePhaseSchema), createPhase)
  .put('/:id', zValidator('json', UpdatePhaseSchema), updatePhase)
  .delete('/:id', deletePhase)
  .post('/:id/reorder', zValidator('json', ReorderPhaseSchema), reorderPhase);
