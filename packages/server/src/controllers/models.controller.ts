// External
import type { Context } from 'hono';

// Services
import { modelCacheService } from '../services/index.js';

/** Returns all cached models grouped by provider type. */
export async function listCachedModels(c: Context) {
  const models = modelCacheService.getAll();
  return c.json(models);
}

/** Refreshes the model cache from all configured providers. */
export async function refreshModelCache(c: Context) {
  const result = await modelCacheService.refreshAll();
  const models = modelCacheService.getAll();
  return c.json({ ...result, models });
}
