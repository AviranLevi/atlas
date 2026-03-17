import { eq } from 'drizzle-orm';
import type { DB } from '../index.js';
import { globalInstructions, dispatchRules } from '../schema/index.js';
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';
import type {
  CreateGlobalInstructions,
  UpdateGlobalInstructions,
  GlobalInstructions,
  CreateDispatchRule,
  UpdateDispatchRule,
  DispatchRule,
} from '@my-agents/shared';

const FILE_PATH = 'db/repositories/settings.repository.ts';

export class SettingsRepository {
  constructor(private readonly db: DB) {}

  // Global Instructions
  findAllGlobalInstructions(): GlobalInstructions[] {
    const FUNCTION_NAME = 'findAllGlobalInstructions';
    try {
      return this.db.select().from(globalInstructions).all() as GlobalInstructions[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query global instructions', { cause: error });
    }
  }

  findGlobalInstructionsById(id: string): GlobalInstructions | null {
    const FUNCTION_NAME = 'findGlobalInstructionsById';
    try {
      const row = this.db
        .select()
        .from(globalInstructions)
        .where(eq(globalInstructions.id, id))
        .get();
      return (row as GlobalInstructions) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query global instructions', { cause: error });
    }
  }

  findGlobalInstructionsByIdOrThrow(id: string): GlobalInstructions {
    const row = this.findGlobalInstructionsById(id);
    if (!row) {
      throw new NotFoundError('GlobalInstructions', id);
    }
    return row;
  }

  insertGlobalInstructions(data: CreateGlobalInstructions): GlobalInstructions {
    const FUNCTION_NAME = 'insertGlobalInstructions';
    try {
      const result = this.db
        .insert(globalInstructions)
        .values(data)
        .returning()
        .get();
      return result as GlobalInstructions;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert global instructions', { cause: error });
    }
  }

  updateGlobalInstructions(
    id: string,
    data: UpdateGlobalInstructions
  ): GlobalInstructions {
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

  removeGlobalInstructions(id: string): void {
    const FUNCTION_NAME = 'removeGlobalInstructions';
    try {
      this.db
        .delete(globalInstructions)
        .where(eq(globalInstructions.id, id))
        .run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete global instructions', {
        cause: error,
      });
    }
  }

  // Dispatch Rules
  findAllDispatchRules(): DispatchRule[] {
    const FUNCTION_NAME = 'findAllDispatchRules';
    try {
      return this.db.select().from(dispatchRules).all() as DispatchRule[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query dispatch rules', { cause: error });
    }
  }

  findDispatchRuleById(id: string): DispatchRule | null {
    const FUNCTION_NAME = 'findDispatchRuleById';
    try {
      const row = this.db
        .select()
        .from(dispatchRules)
        .where(eq(dispatchRules.id, id))
        .get();
      return (row as DispatchRule) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query dispatch rule', { cause: error });
    }
  }

  findDispatchRuleByIdOrThrow(id: string): DispatchRule {
    const row = this.findDispatchRuleById(id);
    if (!row) {
      throw new NotFoundError('DispatchRule', id);
    }
    return row;
  }

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
