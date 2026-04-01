// External
import { eq } from 'drizzle-orm';

// Shared
import type { Integration, UpsertIntegration } from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { integrations } from '../schema/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'db/repositories/integrations.repository.ts';

export class IntegrationsRepository {
  constructor(private readonly db: DB) {}

  /** Returns all integrations. */
  findAll(): Integration[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(integrations).all() as Integration[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query integrations', { cause: error });
    }
  }

  /** Returns an integration by name, or null if not found. */
  findByName(name: string): Integration | null {
    const FUNCTION_NAME = 'findByName';
    try {
      const row = this.db.select().from(integrations).where(eq(integrations.name, name)).get();
      return (row as Integration) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query integration', { cause: error });
    }
  }

  /** Upserts an integration by name and returns the updated record. */
  upsert(name: string, data: UpsertIntegration): Integration {
    const FUNCTION_NAME = 'upsert';
    try {
      const now = new Date().toISOString();
      const existing = this.findByName(name);
      if (existing) {
        const result = this.db
          .update(integrations)
          .set({ ...data, updatedAt: now })
          .where(eq(integrations.name, name))
          .returning()
          .get();
        return result as Integration;
      }
      const result = this.db
        .insert(integrations)
        .values({ name, ...data, createdAt: now, updatedAt: now })
        .returning()
        .get();
      return result as Integration;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to upsert integration', { cause: error });
    }
  }
}
