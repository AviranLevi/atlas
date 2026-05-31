// External
import { eq } from 'drizzle-orm';

// Shared
import type { ProviderModel } from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { modelCache } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'db/repositories/model-cache.repository.ts';

export interface ModelCacheRow {
  providerType: string;
  models: ProviderModel[];
  fetchedAt: string;
}

export class ModelCacheRepository {
  constructor(private readonly db: DB) {}

  /** Returns all cached model entries. */
  findAll(): ModelCacheRow[] {
    const FUNCTION_NAME = 'findAll';
    try {
      const rows = this.db.select().from(modelCache).all();
      return rows.map((r) => ({
        providerType: r.providerType,
        models: JSON.parse(r.models) as ProviderModel[],
        fetchedAt: r.fetchedAt,
      }));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      return [];
    }
  }

  /** Returns cached models for a specific provider type. */
  findByType(providerType: string): ModelCacheRow | null {
    const FUNCTION_NAME = 'findByType';
    try {
      const row = this.db.select().from(modelCache).where(eq(modelCache.providerType, providerType)).get();
      if (!row) return null;
      return {
        providerType: row.providerType,
        models: JSON.parse(row.models) as ProviderModel[],
        fetchedAt: row.fetchedAt,
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      return null;
    }
  }

  /** Upserts cached models for a provider type. */
  upsert(providerType: string, models: ProviderModel[]): void {
    const FUNCTION_NAME = 'upsert';
    try {
      const now = new Date().toISOString();
      const json = JSON.stringify(models);
      this.db.delete(modelCache).where(eq(modelCache.providerType, providerType)).run();
      this.db.insert(modelCache).values({ providerType, models: json, fetchedAt: now }).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    }
  }
}
