// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { CreateMemorySchema, UpdateMemorySchema } from '@atlas/shared';

// Controllers
import { listMemory, getMemory, createMemory, updateMemory, deleteMemory } from '../controllers/memory.controller.js';

export const memoryRoute = new Hono()
  .get('/', listMemory)
  .get('/:id', getMemory)
  .post('/', zValidator('json', CreateMemorySchema), createMemory)
  .put('/:id', zValidator('json', UpdateMemorySchema), updateMemory)
  .delete('/:id', deleteMemory);
