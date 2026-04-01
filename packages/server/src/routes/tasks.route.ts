// External
import { Hono } from 'hono';

// Shared
import { CreateTaskSchema, UpdateTaskSchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import { createTask, deleteTask, getTask, listTasks, updateTask } from '../controllers/tasks.controller.js';

export const tasksRoute = new Hono()
  .get('/', listTasks)
  .get('/:id', getTask)
  .post('/', zValidator('json', CreateTaskSchema), createTask)
  .put('/:id', zValidator('json', UpdateTaskSchema), updateTask)
  .delete('/:id', deleteTask);
