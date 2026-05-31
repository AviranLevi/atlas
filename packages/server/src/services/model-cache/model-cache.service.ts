// Shared
import type { AgentProvider, ProviderModel } from '@atlas/shared';

// Repositories
import { agentProvidersRepository, modelCacheRepository } from '../../db/repositories/index.js';

// Lib
import { LIST_MODEL_FNS } from '../../lib/providers/index.js';
import { withTimeout } from '../../lib/utils/index.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/model-cache/model-cache.service.ts';

export interface CachedModelsResponse {
  [providerType: string]: { models: ProviderModel[]; fetchedAt: string };
}

export class ModelCacheService {
  constructor(
    private readonly cacheRepo = modelCacheRepository,
    private readonly providersRepo = agentProvidersRepository,
  ) {}

  /** Returns all cached models grouped by provider type. */
  getAll(): CachedModelsResponse {
    const rows = this.cacheRepo.findAll();
    const result: CachedModelsResponse = {};
    for (const row of rows) {
      result[row.providerType] = { models: row.models, fetchedAt: row.fetchedAt };
    }
    return result;
  }

  /** Returns cached models for a specific provider type. Empty array if none cached. */
  getByType(providerType: string): ProviderModel[] {
    return this.cacheRepo.findByType(providerType)?.models ?? [];
  }

  /**
   * Refreshes the model cache by fetching models from each configured provider.
   * Uses the first saved provider of each type as the credential source.
   * Non-throwing — logs errors and continues with other providers.
   */
  async refreshAll(): Promise<{ succeeded: number; failed: number }> {
    const providers = this.providersRepo.findAll();

    // Group by type — only need one provider per type for fetching
    const byType = new Map<string, AgentProvider>();
    for (const p of providers) {
      if (!byType.has(p.type)) byType.set(p.type, p);
    }

    if (byType.size === 0) {
      logger.info(`${FILE_PATH} :: refreshAll - no providers configured, skipping`);
      return { succeeded: 0, failed: 0 };
    }

    let succeeded = 0;
    let failed = 0;

    await Promise.allSettled(
      [...byType.entries()].map(async ([type, provider]) => {
        const fn = LIST_MODEL_FNS[type];
        if (!fn) return;

        try {
          const models = await withTimeout(fn(provider), 15_000, `Model cache refresh (${type})`);
          const sorted = models.sort((a, b) => a.label.localeCompare(b.label));
          this.cacheRepo.upsert(type, sorted);
          logger.info(`${FILE_PATH} :: refreshAll - cached ${sorted.length} models for ${type}`);
          succeeded++;
        } catch (error: unknown) {
          logger.warn(`${FILE_PATH} :: refreshAll - failed to fetch models for ${type}`, error);
          failed++;
        }
      }),
    );

    logger.info(`${FILE_PATH} :: refreshAll - done (${succeeded} succeeded, ${failed} failed)`);
    return { succeeded, failed };
  }
}
