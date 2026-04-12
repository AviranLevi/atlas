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
