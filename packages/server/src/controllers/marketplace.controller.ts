// External
import type { Context } from 'hono';

// Shared
import type { MarketplaceListing, MarketplaceSearchParams } from '@atlas/shared';

// Services
import { marketplaceService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Searches the marketplace registry. */
export async function searchMarketplace(c: Context): Promise<Response> {
  const params: MarketplaceSearchParams = {
    q: c.req.query('q') ?? undefined,
    type: (c.req.query('type') as MarketplaceSearchParams['type']) ?? undefined,
    page: parseInt(c.req.query('page') ?? '1', 10),
    limit: parseInt(c.req.query('limit') ?? '20', 10),
  };
  return c.json(await marketplaceService.search(params));
}

/** Installs a package from the marketplace into Atlas. */
export async function installFromMarketplace(c: Context): Promise<Response> {
  const body = getValidatedBody<MarketplaceListing & { projectId?: string }>(c);
  const { projectId, ...listing } = body;
  const summary = await marketplaceService.install(listing, projectId);
  return c.json(summary, 201);
}
