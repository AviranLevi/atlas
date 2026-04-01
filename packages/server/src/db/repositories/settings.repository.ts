// External
import { eq } from 'drizzle-orm';

// Shared
import type {
  CreateDispatchRule,
  CreateGlobalInstructions,
  DispatchRule,
  GlobalInstructions,
  UpdateDispatchRule,
  UpdateGlobalInstructions,
} from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { dispatchRules, globalInstructions } from '../schema/index.js';

// Lib
import { AppError, NotFoundError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'db/repositories/settings.repository.ts';

export class SettingsRepository {
  constructor(private readonly db: DB) {}

  // Global Instructions
  /** Returns all global instructions. */
  findAllGlobalInstructions(): GlobalInstructions[] {
    const FUNCTION_NAME = 'findAllGlobalInstructions';
    try {
      return this.db.select().from(globalInstructions).all() as GlobalInstructions[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query global instructions', { cause: error });
    }
  }

  /** Returns global instructions by ID, or null if not found. */
  findGlobalInstructionsById(id: string): GlobalInstructions | null {
    const FUNCTION_NAME = 'findGlobalInstructionsById';
    try {
      const row = this.db.select().from(globalInstructions).where(eq(globalInstructions.id, id)).get();
      return (row as GlobalInstructions) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query global instructions', { cause: error });
    }
  }

  /** Returns global instructions by ID, or throws NotFoundError. */
  findGlobalInstructionsByIdOrThrow(id: string): GlobalInstructions {
    const row = this.findGlobalInstructionsById(id);
    if (!row) {
      throw new NotFoundError('GlobalInstructions', id);
    }
    return row;
  }

  /** Inserts new global instructions and returns the created record. */
  insertGlobalInstructions(data: CreateGlobalInstructions): GlobalInstructions {
    const FUNCTION_NAME = 'insertGlobalInstructions';
    try {
      const result = this.db.insert(globalInstructions).values(data).returning().get();
      return result as GlobalInstructions;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert global instructions', { cause: error });
    }
  }

  /** Updates global instructions and returns the updated record. */
  updateGlobalInstructions(id: string, data: UpdateGlobalInstructions): GlobalInstructions {
    const FUNCTION_NAME = 'updateGlobalInstructions';
    try {
      const result = this.db
        .update(globalInstructions)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(globalInstructions.id, id))
        .returning()
        .get();
      return result as GlobalInstructions;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update global instructions', { cause: error });
    }
  }

  /** Deletes global instructions by ID. */
  removeGlobalInstructions(id: string): void {
    const FUNCTION_NAME = 'removeGlobalInstructions';
    try {
      this.db.delete(globalInstructions).where(eq(globalInstructions.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete global instructions', {
        cause: error,
      });
    }
  }

  // Dispatch Rules
  /** Returns all dispatch rules. */
  findAllDispatchRules(): DispatchRule[] {
    const FUNCTION_NAME = 'findAllDispatchRules';
    try {
      return this.db.select().from(dispatchRules).all() as DispatchRule[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query dispatch rules', { cause: error });
    }
  }

  /** Returns a dispatch rule by ID, or null if not found. */
  findDispatchRuleById(id: string): DispatchRule | null {
    const FUNCTION_NAME = 'findDispatchRuleById';
    try {
      const row = this.db.select().from(dispatchRules).where(eq(dispatchRules.id, id)).get();
      return (row as DispatchRule) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query dispatch rule', { cause: error });
    }
  }

  /** Returns a dispatch rule by ID, or throws NotFoundError. */
  findDispatchRuleByIdOrThrow(id: string): DispatchRule {
    const row = this.findDispatchRuleById(id);
    if (!row) {
      throw new NotFoundError('DispatchRule', id);
    }
    return row;
  }

  /** Inserts a new dispatch rule and returns the created record. */
  insertDispatchRule(data: CreateDispatchRule): DispatchRule {
    const FUNCTION_NAME = 'insertDispatchRule';
    try {
      const result = this.db.insert(dispatchRules).values(data).returning().get();
      return result as DispatchRule;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert dispatch rule', { cause: error });
    }
  }

  /** Updates a dispatch rule and returns the updated record. */
  updateDispatchRule(id: string, data: UpdateDispatchRule): DispatchRule {
    const FUNCTION_NAME = 'updateDispatchRule';
    try {
      const result = this.db
        .update(dispatchRules)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(dispatchRules.id, id))
        .returning()
        .get();
      return result as DispatchRule;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update dispatch rule', { cause: error });
    }
  }

  /** Deletes a dispatch rule by ID. */
  removeDispatchRule(id: string): void {
    const FUNCTION_NAME = 'removeDispatchRule';
    try {
      this.db.delete(dispatchRules).where(eq(dispatchRules.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete dispatch rule', { cause: error });
    }
  }
}
