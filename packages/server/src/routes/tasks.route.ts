// NPM
import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator';
// Shared
import { CreateTaskSchema, UpdateTaskSchema } from '@my-agents/shared';
// Services
import { tasksService } from '../services/index.js';
// DB
import { db } from '../db/index.js';
import { tasks } from '../db/schema/index.js';
// Types
import type { Task } from '@my-agents/shared';

export const tasksRoute = new Hono()
  .get('/', async (c) => {
    const status = c.req.query('status');
    const projectId = c.req.query('projectId');
    const agentId = c.req.query('agentId');

    const conditions = [];
    if (status) conditions.push(eq(tasks.status, status));
    if (projectId) conditions.push(eq(tasks.projectId, projectId));
    if (agentId) conditions.push(eq(tasks.agentId, agentId));

    if (conditions.length > 0) {
      const rows = db
        .select()
        .from(tasks)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .all();
      const result = rows.map((r) => ({
        ...r,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags ?? null,
      })) as Task[];
      return c.json(result);
    }

    const result = await tasksService.list();
    return c.json(result);
  })
  .get('/:id', async (c) => {
    const task = await tasksService.getById(c.req.param('id'));
    return c.json(task);
  })
  .post('/', zValidator('json', CreateTaskSchema), async (c) => {
    const data = c.req.valid('json');
    const task = await tasksService.create(data);
    return c.json(task, 201);
  })
  .put('/:id', zValidator('json', UpdateTaskSchema), async (c) => {
    const task = await tasksService.update(
      c.req.param('id'),
      c.req.valid('json')
    );
    return c.json(task);
  })
  .delete('/:id', async (c) => {
    await tasksService.delete(c.req.param('id'));
    return c.body(null, 204);
  });
