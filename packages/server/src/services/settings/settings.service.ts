// Shared
import type {
  GlobalInstructions,
  CreateGlobalInstructions,
  UpdateGlobalInstructions,
  DispatchRule,
  CreateDispatchRule,
  UpdateDispatchRule,
} from '@atlas/shared';

// External
import { minimatch } from 'minimatch';

// Repositories
import { settingsRepository } from '../../db/repositories/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/settings/settings.service.ts';

export class SettingsService {
  constructor(private readonly repo = settingsRepository) {}

  /** Returns the singleton global instructions row, creating one if none exists. */
  async getOrCreateGlobalInstructions(): Promise<GlobalInstructions> {
    const FUNCTION_NAME = 'getOrCreateGlobalInstructions';
    try {
      const rows = this.repo.findAllGlobalInstructions();
      if (rows.length > 0) return rows[0];
      return this.repo.insertGlobalInstructions({ content: '' });
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get global instructions', { cause: error });
    }
  }

  /** Updates the singleton global instructions, creating the row if needed. */
  async updateOrCreateGlobalInstructions(
    data: UpdateGlobalInstructions,
  ): Promise<GlobalInstructions> {
    const FUNCTION_NAME = 'updateOrCreateGlobalInstructions';
    try {
      const current = await this.getOrCreateGlobalInstructions();
      return this.repo.updateGlobalInstructions(current.id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update global instructions', { cause: error });
    }
  }

  /** Lists all global instructions. */
  async listGlobalInstructions(): Promise<GlobalInstructions[]> {
    const FUNCTION_NAME = 'listGlobalInstructions';
    try {
      return this.repo.findAllGlobalInstructions();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list global instructions', { cause: error });
    }
  }

  /** Returns global instructions by ID. */
  async getGlobalInstructionsById(id: string): Promise<GlobalInstructions> {
    const FUNCTION_NAME = 'getGlobalInstructionsById';
    try {
      return this.repo.findGlobalInstructionsByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get global instructions', { cause: error });
    }
  }

  /** Creates new global instructions. */
  async createGlobalInstructions(
    data: CreateGlobalInstructions
  ): Promise<GlobalInstructions> {
    const FUNCTION_NAME = 'createGlobalInstructions';
    try {
      return this.repo.insertGlobalInstructions(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create global instructions', {
        cause: error,
      });
    }
  }

  /** Updates global instructions by ID. */
  async updateGlobalInstructions(
    id: string,
    data: UpdateGlobalInstructions
  ): Promise<GlobalInstructions> {
    const FUNCTION_NAME = 'updateGlobalInstructions';
    try {
      return this.repo.updateGlobalInstructions(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update global instructions', {
        cause: error,
      });
    }
  }

  /** Deletes global instructions by ID. */
  async deleteGlobalInstructions(id: string): Promise<void> {
    const FUNCTION_NAME = 'deleteGlobalInstructions';
    try {
      this.repo.removeGlobalInstructions(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete global instructions', {
        cause: error,
      });
    }
  }

  /** Lists all dispatch rules. */
  async listDispatchRules(): Promise<DispatchRule[]> {
    const FUNCTION_NAME = 'listDispatchRules';
    try {
      return this.repo.findAllDispatchRules();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list dispatch rules', { cause: error });
    }
  }

  /** Returns a dispatch rule by ID. */
  async getDispatchRuleById(id: string): Promise<DispatchRule> {
    const FUNCTION_NAME = 'getDispatchRuleById';
    try {
      return this.repo.findDispatchRuleByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get dispatch rule', { cause: error });
    }
  }

  /** Creates a new dispatch rule. */
  async createDispatchRule(data: CreateDispatchRule): Promise<DispatchRule> {
    const FUNCTION_NAME = 'createDispatchRule';
    try {
      return this.repo.insertDispatchRule(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create dispatch rule', { cause: error });
    }
  }

  /** Updates a dispatch rule by ID. */
  async updateDispatchRule(
    id: string,
    data: UpdateDispatchRule
  ): Promise<DispatchRule> {
    const FUNCTION_NAME = 'updateDispatchRule';
    try {
      return this.repo.updateDispatchRule(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update dispatch rule', { cause: error });
    }
  }

  /** Deletes a dispatch rule by ID. */
  async deleteDispatchRule(id: string): Promise<void> {
    const FUNCTION_NAME = 'deleteDispatchRule';
    try {
      this.repo.removeDispatchRule(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete dispatch rule', { cause: error });
    }
  }

  /**
   * Finds the first dispatch rule whose pattern matches the task name.
   * Supports glob patterns (e.g. `feature/*`, `bug-*`) via minimatch,
   * with fallback to case-insensitive substring for plain-string patterns.
   * Returns the agentId/skillId/autoStart to assign, or null if no rule matches.
   */
  async resolveDispatchRule(
    taskName: string,
  ): Promise<{ agentId: string; skillId: string | null; autoStart: boolean } | null> {
    const FUNCTION_NAME = 'resolveDispatchRule';
    try {
      const rules = this.repo.findAllDispatchRules();
      const lowerName = taskName.toLowerCase();
      const match = rules.find((r) => {
        const lowerPattern = r.pattern.toLowerCase();
        return (
          minimatch(lowerName, lowerPattern, { nocase: true }) ||
          lowerName.includes(lowerPattern)
        );
      });
      if (!match) return null;
      return { agentId: match.agentId, skillId: match.skillId, autoStart: match.autoStart ?? false };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      return null;
    }
  }
}
