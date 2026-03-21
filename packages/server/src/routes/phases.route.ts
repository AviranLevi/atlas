import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { CreatePhaseSchema, UpdatePhaseSchema } from '@my-agents/shared';
import { phasesService } from '../services/index.js';

export const phasesRoute = new Hono()
  .get('/', async (c) => {
    const projectId = c.req.query('projectId');
    if (!projectId) {
      return c.json({ error: 'projectId query param is required' }, 400);
    }
    const items = await phasesService.list(projectId);
    return c.json(items);
  })
  .get('/:id', async (c) => {
    const phase = await phasesService.getById(c.req.param('id'));
    const progress = phasesService.getProgress(phase);
    return c.json({ ...phase, progress });
  })
  .post('/', zValidator('json', CreatePhaseSchema), async (c) => {
    const data = c.req.valid('json');
    const item = await phasesService.create(data);
    return c.json(item, 201);
  })
  .put('/:id', zValidator('json', UpdatePhaseSchema), async (c) => {
    const item = await phasesService.update(c.req.param('id'), c.req.valid('json'));
    return c.json(item);
  })
  .delete('/:id', async (c) => {
    await phasesService.delete(c.req.param('id'));
    return c.body(null, 204);
  })
  .post(
    '/:id/reorder',
    zValidator('json', z.object({ newIndex: z.number().int().min(0) })),
    async (c) => {
      const { newIndex } = c.req.valid('json');
      const item = await phasesService.update(c.req.param('id'), { orderIndex: newIndex });
      return c.json(item);
    }
  );
