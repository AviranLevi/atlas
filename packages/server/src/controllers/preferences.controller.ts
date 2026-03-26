// External
import type { Context } from 'hono';

// Services
import { preferencesService } from '../services/index.js';

// Lib
import { AppError } from '../lib/errors.js';

function parsePreferencesBody(body: unknown): Record<string, string> {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError('Request body must be a JSON object', { status: 400 });
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (typeof value !== 'string') {
      throw new AppError(`Preference "${key}" must be a string`, { status: 400 });
    }
    result[key] = value;
  }
  return result;
}

/** Returns all stored preferences. */
export async function getPreferences(c: Context): Promise<Response> {
  const prefs = await preferencesService.getAll();
  return c.json(prefs);
}

/** Merges JSON body into preferences and returns the full map. */
export async function updatePreferences(c: Context): Promise<Response> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new AppError('Invalid JSON body', { status: 400 });
  }
  const data = parsePreferencesBody(body);
  await preferencesService.setMany(data);
  const prefs = await preferencesService.getAll();
  return c.json(prefs);
}
