// Repositories
import { preferencesRepository } from '../../db/repositories/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/preferences.service.ts';

export class PreferencesService {
  constructor(private readonly repo = preferencesRepository) {}

  /** Returns all preferences as a key-value map. */
  async getAll(): Promise<Record<string, string>> {
    const FUNCTION_NAME = 'getAll';
    try {
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get preferences', { cause: error });
    }
  }

  /** Returns a single preference value or null. */
  async get(key: string): Promise<string | null> {
    const FUNCTION_NAME = 'get';
    try {
      return this.repo.get(key);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get preference', { cause: error });
    }
  }

  /** Sets one preference key. */
  async set(key: string, value: string): Promise<void> {
    const FUNCTION_NAME = 'set';
    try {
      this.repo.set(key, value);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to set preference', { cause: error });
    }
  }

  /** Sets multiple preference keys. */
  async setMany(data: Record<string, string>): Promise<void> {
    const FUNCTION_NAME = 'setMany';
    try {
      for (const [key, value] of Object.entries(data)) {
        this.repo.set(key, value);
      }
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to set preferences', { cause: error });
    }
  }
}
