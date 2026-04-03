// Shared
import type { AiConfig, CreateRule, Rule, UpdateRule } from '@atlas/shared';

// Repositories
import { rulesRepository } from '../../db/repositories/index.js';

// Lib
import type { RuleDetail } from './rules.types.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/rules/rules.service.ts';

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

  /** Bulk-imports detected AI config files as rules linked to a project. */
  async bulkImportRules(
    projectId: string,
    items: AiConfig[],
  ): Promise<{ imported: number; ids: string[] }> {
    const FUNCTION_NAME = 'bulkImportRules';
    try {
      const ids: string[] = [];
      for (const item of items) {
        const rule = this.repo.insert({
          name: item.name,
          type: item.type ?? 'General',
          tags: [item.source, item.filePath],
          content: item.content,
          projectId,
        });
        ids.push(rule.id);
      }
      return { imported: ids.length, ids };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to bulk-import rules', { cause: error });
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
