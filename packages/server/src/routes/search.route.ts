// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { SearchQuerySchema } from '@my-agents/shared';

// Controllers
import { search } from '../controllers/search.controller.js';

export const searchRoute = new Hono().get('/', zValidator('query', SearchQuerySchema), search);
