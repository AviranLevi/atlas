import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { searchService } from '../services/index.js';

const SearchQuerySchema = z.object({
  q: z.string().min(1),
});

export const searchRoute = new Hono().get(
  '/',
  zValidator('query', SearchQuerySchema),
  async (c) => {
    const { q } = c.req.valid('query');
    const results = await searchService.search(q);
    return c.json(results);
  }
);
