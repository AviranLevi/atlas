// Shared
import type { Integration, UpsertIntegration } from '@atlas/shared';

// Repositories
import { integrationsRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/integrations/integrations.service.ts';

export class IntegrationsService {
  constructor(private readonly repo = integrationsRepository) {}

  /** Returns all integrations. */
  async list(): Promise<Integration[]> {
    const FUNCTION_NAME = 'list';
    try {
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list integrations', { cause: error });
    }
  }

  /** Returns an integration by name, or null if not configured. */
  async getByName(name: string): Promise<Integration | null> {
    const FUNCTION_NAME = 'getByName';
    try {
      return this.repo.findByName(name);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get integration', { cause: error });
    }
  }

  /** Upserts an integration by name (creates if not exists, updates if exists). */
  async upsert(name: string, data: UpsertIntegration): Promise<Integration> {
    const FUNCTION_NAME = 'upsert';
    try {
      return this.repo.upsert(name, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to upsert integration', { cause: error });
    }
  }
}
