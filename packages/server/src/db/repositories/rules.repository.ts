// External
import { eq } from 'drizzle-orm';

// Shared
import type { CreateRule, UpdateRule, Rule } from '@my-agents/shared';

// DB
import type { DB } from '../index.js';
import { rules } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';

const FILE_PATH = 'db/repositories/rules.repository.ts';

export class RulesRepository {
  constructor(private readonly db: DB) {}

  /** Returns all rules with tags JSON parsed. */
  findAll(): Rule[] {
    const FUNCTION_NAME = 'findAll';
    try {
      const rows = this.db.select().from(rules).all();
      return rows.map((row) => ({
        ...row,
        tags: JSON.parse(row.tags ?? '[]') as string[],
      })) as Rule[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query rules', { cause: error });
    }
  }

  /** Returns a rule by ID with tags JSON parsed, or null if not found. */
  findById(id: string): Rule | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(rules).where(eq(rules.id, id)).get();
      if (!row) return null;
      return {
        ...row,
        tags: JSON.parse(row.tags ?? '[]') as string[],
      } as Rule;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query rule', { cause: error });
    }
  }

  /** Returns a rule by ID with tags JSON parsed, or throws NotFoundError. */
  findByIdOrThrow(id: string): Rule {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Rule', id);
    }
    return row;
  }

  /** Inserts a new rule with tags serialized to JSON. */
  insert(data: CreateRule): Rule {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db
        .insert(rules)
        .values({
          ...data,
          tags: JSON.stringify(data.tags),
        })
        .returning()
        .get();
      return {
        ...result,
        tags: data.tags,
      } as Rule;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert rule', { cause: error });
    }
  }

  /** Updates a rule and returns the updated record. */
  update(id: string, data: UpdateRule): Rule {
    const FUNCTION_NAME = 'update';
    try {
      const updateData: Record<string, unknown> = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      if (data.tags !== undefined) {
        updateData.tags = JSON.stringify(data.tags);
      }
      const result = this.db
        .update(rules)
        .set(updateData)
        .where(eq(rules.id, id))
        .returning()
        .get();
      return {
        ...result,
        tags: data.tags !== undefined ? data.tags : JSON.parse(result.tags ?? '[]'),
      } as Rule;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update rule', { cause: error });
    }
  }

  /** Deletes a rule by ID. */
  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(rules).where(eq(rules.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete rule', { cause: error });
    }
  }
}
