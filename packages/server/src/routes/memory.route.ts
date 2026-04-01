// External
import { Hono } from 'hono';

// Shared
import { CreateMemorySchema, UpdateMemorySchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import { createMemory, deleteMemory, getMemory, listMemory, updateMemory } from '../controllers/memory.controller.js';

export const memoryRoute = new Hono()
  .get('/', listMemory)
  .get('/:id', getMemory)
  .post('/', zValidator('json', CreateMemorySchema), createMemory)
  .put('/:id', zValidator('json', UpdateMemorySchema), updateMemory)
  .delete('/:id', deleteMemory);
