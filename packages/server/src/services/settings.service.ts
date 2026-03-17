import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';
import { settingsRepository } from '../db/repositories/index.js';
import type {
  GlobalInstructions,
  CreateGlobalInstructions,
  UpdateGlobalInstructions,
  DispatchRule,
  CreateDispatchRule,
  UpdateDispatchRule,
} from '@my-agents/shared';

const FILE_PATH = 'services/settings.service.ts';

export class SettingsService {
  constructor(private readonly repo = settingsRepository) {}

  // Global Instructions
  /**
   * Retrieves all global instructions.
   */
  async listGlobalInstructions(): Promise<GlobalInstructions[]> {
    const FUNCTION_NAME = 'listGlobalInstructions';
    try {
      return this.repo.findAllGlobalInstructions();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list global instructions', { cause: error });
    }
  }

  /**
   * Retrieves global instructions by ID.
   * @param id - The global instructions UUID.
   */
  async getGlobalInstructionsById(id: string): Promise<GlobalInstructions> {
    const FUNCTION_NAME = 'getGlobalInstructionsById';
    try {
      return this.repo.findGlobalInstructionsByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get global instructions', { cause: error });
    }
  }

  /**
   * Creates new global instructions.
   * @param data - The creation data.
   */
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

  /**
   * Updates global instructions by ID.
   * @param id - The global instructions UUID.
   * @param data - The partial update data.
   */
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

  /**
   * Deletes global instructions by ID.
   * @param id - The global instructions UUID.
   */
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

  // Dispatch Rules
  /**
   * Retrieves all dispatch rules.
   */
  async listDispatchRules(): Promise<DispatchRule[]> {
    const FUNCTION_NAME = 'listDispatchRules';
    try {
      return this.repo.findAllDispatchRules();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list dispatch rules', { cause: error });
    }
  }

  /**
   * Retrieves a dispatch rule by ID.
   * @param id - The dispatch rule UUID.
   */
  async getDispatchRuleById(id: string): Promise<DispatchRule> {
    const FUNCTION_NAME = 'getDispatchRuleById';
    try {
      return this.repo.findDispatchRuleByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get dispatch rule', { cause: error });
    }
  }

  /**
   * Creates a new dispatch rule.
   * @param data - The creation data.
   */
  async createDispatchRule(data: CreateDispatchRule): Promise<DispatchRule> {
    const FUNCTION_NAME = 'createDispatchRule';
    try {
      return this.repo.insertDispatchRule(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create dispatch rule', { cause: error });
    }
  }

  /**
   * Updates a dispatch rule by ID.
   * @param id - The dispatch rule UUID.
   * @param data - The partial update data.
   */
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

  /**
   * Deletes a dispatch rule by ID.
   * @param id - The dispatch rule UUID.
   */
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
