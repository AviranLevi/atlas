import { z } from 'zod';
import { PackageTypeEnum } from './package.schema';

export const MarketplaceListingSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: PackageTypeEnum,
  version: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  downloads: z.number().int().optional(),
  rating: z.number().min(0).max(5).optional(),
  publishedAt: z.string(),
  packageUrl: z.string().url(),
});

export const MarketplaceSearchParamsSchema = z.object({
  q: z.string().optional(),
  type: PackageTypeEnum.optional(),
  tags: z.array(z.string()).optional(),
  page: z.coerce.number().int().default(1),
  limit: z.coerce.number().int().default(20),
});

export const MarketplaceSearchResultSchema = z.object({
  items: z.array(MarketplaceListingSchema),
  total: z.number().int(),
  page: z.number().int(),
  hasMore: z.boolean(),
});

/** Request body for installing a listing into a project. */
export const MarketplaceInstallBodySchema = MarketplaceListingSchema.extend({
  projectId: z.string().uuid().optional(),
});

export type MarketplaceListing = z.infer<typeof MarketplaceListingSchema>;
export type MarketplaceSearchParams = z.infer<typeof MarketplaceSearchParamsSchema>;
export type MarketplaceSearchResult = z.infer<typeof MarketplaceSearchResultSchema>;
export type MarketplaceInstallBody = z.infer<typeof MarketplaceInstallBodySchema>;
