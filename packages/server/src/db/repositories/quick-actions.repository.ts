// External
import { asc, eq, isNull, or } from 'drizzle-orm';

// Shared
import type { QuickAction, CreateQuickAction, UpdateQuickAction } from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { quickActions } from '../schema/index.js';

// Lib
import { AppError, NotFoundError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'db/repositories/quick-actions.repository.ts';

export class QuickActionsRepository {
  constructor(private readonly db: DB) {}

  findAll(): QuickAction[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(quickActions).orderBy(asc(quickActions.sortOrder)).all() as QuickAction[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query quick actions', { cause: error });
    }
  }

  findById(id: string): QuickAction | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(quickActions).where(eq(quickActions.id, id)).get();
      return (row as QuickAction) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query quick action', { cause: error });
    }
  }

  findByIdOrThrow(id: string): QuickAction {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('QuickAction', id);
    }
    return row;
  }

  findByProjectOrGlobal(projectId: string): QuickAction[] {
    const FUNCTION_NAME = 'findByProjectOrGlobal';
    try {
      const rows = this.db
        .select()
        .from(quickActions)
        .where(or(eq(quickActions.projectId, projectId), isNull(quickActions.projectId)))
        .orderBy(asc(quickActions.sortOrder))
        .all();
      return rows as QuickAction[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query quick actions by project', { cause: error });
    }
  }

  insert(data: CreateQuickAction): QuickAction {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db.insert(quickActions).values(data).returning().get();
      return result as QuickAction;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert quick action', { cause: error });
    }
  }

  update(id: string, data: UpdateQuickAction): QuickAction {
    const FUNCTION_NAME = 'update';
    try {
      const result = this.db
        .update(quickActions)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(quickActions.id, id))
        .returning()
        .get();
      return result as QuickAction;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update quick action', { cause: error });
    }
  }

  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(quickActions).where(eq(quickActions.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete quick action', { cause: error });
    }
  }
}
