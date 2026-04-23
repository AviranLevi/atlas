// Shared
import type {
  ImportSummary,
  MarketplaceListing,
  MarketplaceSearchParams,
  MarketplaceSearchResult,
} from '@atlas/shared';
import { AtlasPackageSchema, MarketplaceSearchResultSchema } from '@atlas/shared';

// Services
import { packageImporterService } from '../index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/marketplace/marketplace.service.ts';
const DEFAULT_REGISTRY_URL = 'https://registry.atlas.sh';

export class MarketplaceService {
  private readonly registryUrl: string;

  constructor() {
    this.registryUrl = process.env.ATLAS_REGISTRY_URL ?? DEFAULT_REGISTRY_URL;
  }

  /** Searches the marketplace registry. */
  async search(params: MarketplaceSearchParams): Promise<MarketplaceSearchResult> {
    const FUNCTION_NAME = 'search';
    try {
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.type) qs.set('type', params.type);
      if (params.tags?.length) qs.set('tags', params.tags.join(','));
      qs.set('page', String(params.page));
      qs.set('limit', String(params.limit));

      const res = await fetch(`${this.registryUrl}/api/v1/packages?${qs.toString()}`);
      if (!res.ok) {
        throw new AppError(`Registry returned ${res.status}: ${res.statusText}`, { status: 502 });
      }

      const json = await res.json();
      return MarketplaceSearchResultSchema.parse(json);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to search marketplace', { cause: error });
    }
  }

  /** Fetches and installs a package from the marketplace. */
  async install(listing: MarketplaceListing, projectId?: string): Promise<ImportSummary> {
    const FUNCTION_NAME = 'install';
    try {
      const res = await fetch(listing.packageUrl);
      if (!res.ok) {
        throw new AppError(`Failed to download package: ${res.status}`, { status: 502 });
      }

      const json = await res.json();
      const pkg = AtlasPackageSchema.parse(json);

      const preview = await packageImporterService.previewImport(pkg);
      const resolutions = preview.items.map((item) => ({
        name: item.name,
        action: item.action === 'create' ? ('create' as const) : ('rename' as const),
        renamedTo: item.action !== 'create' ? `${item.name}-installed` : undefined,
      }));

      return packageImporterService.applyImport(pkg, resolutions, projectId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to install marketplace package', { cause: error });
    }
  }
}
