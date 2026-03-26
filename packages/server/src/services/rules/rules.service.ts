// Shared
import type { Rule, CreateRule, UpdateRule } from '@my-agents/shared';

// Types
import type { RuleDetail } from './rules.types.js';

// Repositories
import { rulesRepository } from '../../db/repositories/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/rules.service.ts';

export class RulesService {
  constructor(private readonly repo = rulesRepository) {}

  /**
   * Retrieves all rules, optionally filtered by projectId.
   * When projectId is provided, returns rules where projectId matches OR projectId is null (global).
   */
  async list(filters?: { projectId?: string; type?: string }): Promise<Rule[]> {
    const FUNCTION_NAME = 'list';
    try {
      let result: Rule[];
      if (filters?.projectId) {
        result = this.repo.findByProjectOrGlobal(filters.projectId);
      } else {
        result = this.repo.findAll();
      }
      if (filters?.type) {
        result = result.filter((r) => r.type === filters.type);
      }
      return result;
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

  /** Returns a rule with its associated agents. */
  async getDetail(ruleId: string): Promise<RuleDetail> {
    const FUNCTION_NAME = 'getDetail';
    try {
      const rule = await this.getById(ruleId);
      const agentsList = this.repo.findAgentsByRuleId(ruleId);
      return { rule, agents: agentsList };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get rule detail', { cause: error });
    }
  }
}
