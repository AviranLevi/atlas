import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateMemorySchema, UpdateMemorySchema } from '@my-agents/shared';
import { memoryService } from '../services/index.js';

export const memoryRoute = new Hono()
  .get('/', async (c) => {
    const memory = await memoryService.list();
    return c.json(memory);
  })
  .get('/:id', async (c) => {
    const mem = await memoryService.getById(c.req.param('id'));
    return c.json(mem);
  })
  .post('/', zValidator('json', CreateMemorySchema), async (c) => {
    const data = c.req.valid('json');
    const mem = await memoryService.create(data);
    return c.json(mem, 201);
  })
  .put('/:id', zValidator('json', UpdateMemorySchema), async (c) => {
    const mem = await memoryService.update(
      c.req.param('id'),
      c.req.valid('json')
    );
    return c.json(mem);
  })
  .delete('/:id', async (c) => {
    await memoryService.delete(c.req.param('id'));
    return c.body(null, 204);
  });
