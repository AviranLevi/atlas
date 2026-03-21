import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateAgentProviderSchema, UpdateAgentProviderSchema } from '@my-agents/shared';
import { agentProvidersService } from '../services/index.js';

export const agentProvidersRoute = new Hono()
  .get('/', async (c) => {
    const items = await agentProvidersService.list();
    return c.json(items);
  })
  .get('/:id', async (c) => {
    const item = await agentProvidersService.getById(c.req.param('id'));
    return c.json(item);
  })
  .post('/', zValidator('json', CreateAgentProviderSchema), async (c) => {
    const data = c.req.valid('json');
    const item = await agentProvidersService.create(data);
    return c.json(item, 201);
  })
  .put('/:id', zValidator('json', UpdateAgentProviderSchema), async (c) => {
    const item = await agentProvidersService.update(c.req.param('id'), c.req.valid('json'));
    return c.json(item);
  })
  .delete('/:id', async (c) => {
    await agentProvidersService.delete(c.req.param('id'));
    return c.body(null, 204);
  })
  .post('/:id/test', async (c) => {
    const result = await agentProvidersService.testConnection(c.req.param('id'));
    return c.json(result);
  });
