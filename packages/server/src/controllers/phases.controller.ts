// External
import type { Context } from 'hono';

// Shared
import type { CreatePhase, UpdatePhase } from '@my-agents/shared';

// Services
import { phasesService } from '../services/index.js';

/** Lists phases for a project. Requires projectId query param. */
export async function listPhases(c: Context) {
  const projectId = c.req.query('projectId');
  if (!projectId) {
    return c.json({ error: 'projectId query param is required' }, 400);
  }
  const items = await phasesService.list(projectId);
  return c.json(items);
}

/** Returns a phase by ID with computed progress. */
export async function getPhase(c: Context) {
  const phase = await phasesService.getById(c.req.param('id')!);
  const progress = phasesService.getProgress(phase);
  return c.json({ ...phase, progress });
}

/** Creates a new phase. */
export async function createPhase(c: Context) {
  const data = (c.req as any).valid('json') as CreatePhase;
  const item = await phasesService.create(data);
  return c.json(item, 201);
}

/** Updates a phase by ID. */
export async function updatePhase(c: Context) {
  const item = await phasesService.update(c.req.param('id')!, (c.req as any).valid('json') as UpdatePhase);
  return c.json(item);
}

/** Deletes a phase by ID. */
export async function deletePhase(c: Context) {
  await phasesService.delete(c.req.param('id')!);
  return c.body(null, 204);
}

/** Updates the order index of a phase. */
export async function reorderPhase(c: Context) {
  const { newIndex } = (c.req as any).valid('json') as { newIndex: number };
  const item = await phasesService.update(c.req.param('id')!, { orderIndex: newIndex });
  return c.json(item);
}
