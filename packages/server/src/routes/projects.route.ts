import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateProjectSchema, UpdateProjectSchema } from '@my-agents/shared';
import { projectsService } from '../services/index.js';

export const projectsRoute = new Hono()
  .get('/', async (c) => {
    const projects = await projectsService.list();
    return c.json(projects);
  })
  .get('/:id', async (c) => {
    const project = await projectsService.getById(c.req.param('id'));
    return c.json(project);
  })
  .post('/', zValidator('json', CreateProjectSchema), async (c) => {
    const data = c.req.valid('json');
    const project = await projectsService.create(data);
    return c.json(project, 201);
  })
  .put('/:id', zValidator('json', UpdateProjectSchema), async (c) => {
    const project = await projectsService.update(
      c.req.param('id'),
      c.req.valid('json')
    );
    return c.json(project);
  })
  .delete('/:id', async (c) => {
    await projectsService.delete(c.req.param('id'));
    return c.body(null, 204);
  });
