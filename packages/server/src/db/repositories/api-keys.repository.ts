// External
import { eq } from 'drizzle-orm';

// Shared
import type { ApiKey } from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { apiKeys } from '../schema/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'db/repositories/api-keys.repository.ts';

export class ApiKeysRepository {
  constructor(private readonly db: DB) {}

  /** Returns all API keys (without the hash). */
  findAll(): ApiKey[] {
    const FUNCTION_NAME = 'findAll';
    try {
      const rows = this.db.select().from(apiKeys).all();
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        keyPrefix: r.keyPrefix,
        createdAt: r.createdAt,
        lastUsedAt: r.lastUsedAt ?? null,
      }));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query API keys', { cause: error });
    }
  }

  /** Finds a key row by hash. Returns the full row including hash, or null. */
  findByHash(hash: string): (ApiKey & { keyHash: string }) | null {
    const FUNCTION_NAME = 'findByHash';
    try {
      const row = this.db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash)).get();
      if (!row) return null;
      return { ...row, lastUsedAt: row.lastUsedAt ?? null };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query API key by hash', { cause: error });
    }
  }

  /** Inserts a new API key record. */
  insert(data: { id: string; name: string; keyHash: string; keyPrefix: string; createdAt: string }): void {
    const FUNCTION_NAME = 'insert';
    try {
      this.db.insert(apiKeys).values(data).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert API key', { cause: error });
    }
  }

  /** Updates the last used timestamp. */
  updateLastUsed(id: string): void {
    const FUNCTION_NAME = 'updateLastUsed';
    try {
      this.db
        .update(apiKeys)
        .set({ lastUsedAt: new Date().toISOString() })
        .where(eq(apiKeys.id, id))
        .run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update API key last used', { cause: error });
    }
  }

  /** Deletes an API key by ID. */
  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(apiKeys).where(eq(apiKeys.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete API key', { cause: error });
    }
  }
}
