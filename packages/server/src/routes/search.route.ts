// External
import { Hono } from 'hono';

// Shared
import { SearchQuerySchema } from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import { search } from '../controllers/search.controller.js';

export const searchRoute = new Hono().get('/', zValidator('query', SearchQuerySchema), search);
