// External
import type { Context } from 'hono';

// Services
import { preferencesService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Returns all stored preferences. */
export async function getPreferences(c: Context): Promise<Response> {
  const prefs = await preferencesService.getAll();
  return c.json(prefs);
}

/** Merges JSON body into preferences and returns the full map. */
export async function updatePreferences(c: Context): Promise<Response> {
  const data = getValidatedBody<Record<string, string>>(c);
  await preferencesService.setMany(data);
  const prefs = await preferencesService.getAll();
  return c.json(prefs);
}
