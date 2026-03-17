import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateRuleSchema, UpdateRuleSchema } from '@my-agents/shared';
import { rulesService } from '../services/index.js';

export const rulesRoute = new Hono()
  .get('/', async (c) => {
    const rules = await rulesService.list();
    return c.json(rules);
  })
  .get('/:id', async (c) => {
    const rule = await rulesService.getById(c.req.param('id'));
    return c.json(rule);
  })
  .post('/', zValidator('json', CreateRuleSchema), async (c) => {
    const data = c.req.valid('json');
    const rule = await rulesService.create(data);
    return c.json(rule, 201);
  })
  .put('/:id', zValidator('json', UpdateRuleSchema), async (c) => {
    const rule = await rulesService.update(
      c.req.param('id'),
      c.req.valid('json')
    );
    return c.json(rule);
  })
  .delete('/:id', async (c) => {
    await rulesService.delete(c.req.param('id'));
    return c.body(null, 204);
  });
