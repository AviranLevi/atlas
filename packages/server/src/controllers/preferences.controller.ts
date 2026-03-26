import type { Context } from 'hono';
import { preferencesService } from '../services/index.js';

/** Returns all stored preferences. */
export async function getPreferences(c: Context): Promise<Response> {
  const prefs = await preferencesService.getAll();
  return c.json(prefs);
}

/** Merges JSON body into preferences and returns the full map. */
export async function updatePreferences(c: Context): Promise<Response> {
  const data = (c.req as any).valid('json') as Record<string, string>;
  await preferencesService.setMany(data);
  const prefs = await preferencesService.getAll();
  return c.json(prefs);
}
