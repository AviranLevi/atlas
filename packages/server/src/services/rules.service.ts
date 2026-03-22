// External
import { eq, or, isNull } from 'drizzle-orm';

// Shared
import type { Rule, CreateRule, UpdateRule } from '@my-agents/shared';

// DB
import { db } from '../db/index.js';
import { rules } from '../db/schema/index.js';

// Repositories
import { rulesRepository } from '../db/repositories/index.js';

// Lib
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

const FILE_PATH = 'services/rules.service.ts';

export class RulesService {
  constructor(private readonly repo = rulesRepository) {}

  /**
   * Retrieves all rules, optionally filtered by projectId.
   * When projectId is provided, returns rules where projectId matches OR projectId is null (global).
   */
  async list(projectId?: string): Promise<Rule[]> {
    const FUNCTION_NAME = 'list';
    try {
      if (projectId) {
        const rows = db
          .select()
          .from(rules)
          .where(or(eq(rules.projectId, projectId), isNull(rules.projectId)))
          .all();
        return rows.map((r) => ({
          ...r,
          tags: JSON.parse(r.tags ?? '[]'),
        })) as Rule[];
      }
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list rules', { cause: error });
    }
  }

  /** Returns a rule by ID. */
  async getById(id: string): Promise<Rule> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get rule', { cause: error });
    }
  }

  /** Creates a new rule. */
  async create(data: CreateRule): Promise<Rule> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create rule', { cause: error });
    }
  }

  /** Updates a rule by ID. */
  async update(id: string, data: UpdateRule): Promise<Rule> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update rule', { cause: error });
    }
  }

  /** Deletes a rule by ID. */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete rule', { cause: error });
    }
  }
}
