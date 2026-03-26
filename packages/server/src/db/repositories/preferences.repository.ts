// External
import { eq } from 'drizzle-orm';

// DB
import type { DB } from '../index.js';
import { preferences } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'db/repositories/preferences.repository.ts';

export class PreferencesRepository {
  constructor(private readonly db: DB) {}

  /** Returns all preference rows as a key-value object. */
  findAll(): Record<string, string> {
    const FUNCTION_NAME = 'findAll';
    try {
      const rows = this.db.select().from(preferences).all();
      return Object.fromEntries(rows.map((r) => [r.key, r.value]));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query preferences', { cause: error });
    }
  }

  /** Returns a preference value by key, or null if missing. */
  get(key: string): string | null {
    const FUNCTION_NAME = 'get';
    try {
      const row = this.db
        .select()
        .from(preferences)
        .where(eq(preferences.key, key))
        .get();
      return row?.value ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query preference', { cause: error });
    }
  }

  /** Upserts a preference by key. */
  set(key: string, value: string): void {
    const FUNCTION_NAME = 'set';
    try {
      this.db.delete(preferences).where(eq(preferences.key, key)).run();
      this.db.insert(preferences).values({ key, value }).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to set preference', { cause: error });
    }
  }

  /** Removes a preference by key. */
  remove(key: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(preferences).where(eq(preferences.key, key)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to remove preference', { cause: error });
    }
  }
}
