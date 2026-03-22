// Shared
import type {
  GlobalInstructions,
  CreateGlobalInstructions,
  UpdateGlobalInstructions,
  DispatchRule,
  CreateDispatchRule,
  UpdateDispatchRule,
} from '@my-agents/shared';

// Repositories
import { settingsRepository } from '../db/repositories/index.js';

// Lib
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

const FILE_PATH = 'services/settings.service.ts';

export class SettingsService {
  constructor(private readonly repo = settingsRepository) {}

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
}
