// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateTaskSchema, UpdateTaskSchema } from '@my-agents/shared';

// Controllers
import { listTasks, getTask, createTask, updateTask, deleteTask } from '../controllers/tasks.controller.js';

export const tasksRoute = new Hono()
  .get('/', listTasks)
  .get('/:id', getTask)
  .post('/', zValidator('json', CreateTaskSchema), createTask)
  .put('/:id', zValidator('json', UpdateTaskSchema), updateTask)
  .delete('/:id', deleteTask);
