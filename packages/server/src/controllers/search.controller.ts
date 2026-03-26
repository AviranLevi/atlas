// External
import type { Context } from 'hono';

// Services
import { searchService } from '../services/index.js';

// Lib
import { getValidatedQuery } from '../lib/hono-helpers.js';

/** Full-text search across agents, skills, rules, memory, tasks, and projects. */
export async function search(c: Context) {
  const { q } = getValidatedQuery<{ q: string }>(c);
  const results = await searchService.search(q);
  return c.json(results);
}
