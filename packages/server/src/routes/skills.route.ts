import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateSkillSchema, UpdateSkillSchema } from '@my-agents/shared';
import { skillsService } from '../services/index.js';

export const skillsRoute = new Hono()
  .get('/', async (c) => {
    const skills = await skillsService.list();
    return c.json(skills);
  })
  .get('/:id', async (c) => {
    const skill = await skillsService.getById(c.req.param('id'));
    return c.json(skill);
  })
  .post('/', zValidator('json', CreateSkillSchema), async (c) => {
    const data = c.req.valid('json');
    const skill = await skillsService.create(data);
    return c.json(skill, 201);
  })
  .put('/:id', zValidator('json', UpdateSkillSchema), async (c) => {
    const skill = await skillsService.update(c.req.param('id'), c.req.valid('json'));
    return c.json(skill);
  })
  .delete('/:id', async (c) => {
    await skillsService.delete(c.req.param('id'));
    return c.body(null, 204);
  });
