// External
import type { Context } from 'hono';

// Shared
import type { CreateApiKey } from '@atlas/shared';

// Services
import { authService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Lists all API keys. */
export async function listApiKeys(c: Context) {
  return c.json(await authService.listKeys());
}

/** Creates a new API key. */
export async function createApiKey(c: Context) {
  const data = getValidatedBody<CreateApiKey>(c);
  const result = await authService.generateKey(data.name);
  return c.json({ ...result.apiKey, rawKey: result.rawKey }, 201);
}

/** Revokes an API key. */
export async function deleteApiKey(c: Context) {
  await authService.revokeKey(c.req.param('id')!);
  return c.body(null, 204);
}

/** First-time setup — creates the initial key. Only works when no keys exist. */
export async function setupApiKey(c: Context) {
  const data = getValidatedBody<CreateApiKey>(c);
  const result = await authService.setupFirstKey(data.name);
  return c.json({ ...result.apiKey, rawKey: result.rawKey }, 201);
}

/**
 * Browser bootstrap — silently mints the first API key on a fresh install.
 * Locked to localhost origins by `localOnly` middleware on the route. Returns
 * 409 with `details.code = 'ALREADY_INITIALIZED'` if any key already exists,
 * which the client uses to surface a targeted recovery banner.
 */
export async function bootstrapApiKey(c: Context) {
  const result = await authService.bootstrapKey();
  return c.json({ ...result.apiKey, rawKey: result.rawKey }, 201);
}
