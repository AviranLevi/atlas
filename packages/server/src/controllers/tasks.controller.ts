// External
import type { Context } from 'hono';

// Shared
import type { CreateTask, UpdateTask } from '@my-agents/shared';

// Services
import { tasksService } from '../services/index.js';

/** Lists tasks, optionally filtered by status, projectId, or agentId. */
export async function listTasks(c: Context) {
  const status = c.req.query('status');
  const projectId = c.req.query('projectId');
  const agentId = c.req.query('agentId');
  const result = await tasksService.list({ status, projectId, agentId });
  return c.json(result);
}

/** Returns a task by ID. */
export async function getTask(c: Context) {
  const task = await tasksService.getById(c.req.param('id')!);
  return c.json(task);
}

/** Creates a new task. */
export async function createTask(c: Context) {
  const data = (c.req as any).valid('json') as CreateTask;
  const task = await tasksService.create(data);
  return c.json(task, 201);
}

/** Updates a task by ID. */
export async function updateTask(c: Context) {
  const task = await tasksService.update(c.req.param('id')!, (c.req as any).valid('json') as UpdateTask);
  return c.json(task);
}

/** Deletes a task and its related records. */
export async function deleteTask(c: Context) {
  await tasksService.delete(c.req.param('id')!);
  return c.body(null, 204);
}
