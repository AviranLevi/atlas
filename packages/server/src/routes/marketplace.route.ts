// External
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Shared
import { MarketplaceInstallBodySchema } from '@atlas/shared';

// Controllers
import { installFromMarketplace, searchMarketplace } from '../controllers/marketplace.controller.js';

export const marketplaceRoute = new Hono()
  .get('/search', searchMarketplace)
  .post('/install', zValidator('json', MarketplaceInstallBodySchema), installFromMarketplace);
