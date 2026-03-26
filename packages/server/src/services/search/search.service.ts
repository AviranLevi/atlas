// Types
import type { SearchResult } from './search.types.js';

// Repositories
import { searchRepository } from '../../db/repositories/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/search.service.ts';

export class SearchService {
  constructor(private readonly repo = searchRepository) {}

  /**
   * Full-text search across all entities using SQLite LIKE.
   * @param query - The search query string.
   */
  search(query: string): SearchResult[] {
    const FUNCTION_NAME = 'search';
    try {
      return this.repo.searchAll(query);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to search', { cause: error });
    }
  }
}
