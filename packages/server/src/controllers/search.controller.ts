// External
import type { Context } from 'hono';

// Services
import { searchService } from '../services/index.js';

/** Full-text search across agents, skills, rules, memory, tasks, and projects. */
export async function search(c: Context) {
  const { q } = (c.req as any).valid('query') as { q: string };
  const results = await searchService.search(q);
  return c.json(results);
}
