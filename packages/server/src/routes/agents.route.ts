import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateAgentSchema, UpdateAgentSchema } from '@my-agents/shared';
import { agentsService } from '../services/index.js';

export const agentsRoute = new Hono()
  .get('/', async (c) => {
    const agents = await agentsService.list();
    return c.json(agents);
  })
  .get('/:id', async (c) => {
    const agent = await agentsService.getById(c.req.param('id'));
    return c.json(agent);
  })
  .post('/', zValidator('json', CreateAgentSchema), async (c) => {
    const data = c.req.valid('json');
    const agent = await agentsService.create(data);
    return c.json(agent, 201);
  })
  .put('/:id', zValidator('json', UpdateAgentSchema), async (c) => {
    const agent = await agentsService.update(c.req.param('id'), c.req.valid('json'));
    return c.json(agent);
  })
  .delete('/:id', async (c) => {
    await agentsService.delete(c.req.param('id'));
    return c.body(null, 204);
  });
