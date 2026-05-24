// External
import { asc, eq, isNull, or } from 'drizzle-orm';

// Shared
import type { Automation, CreateAutomation, UpdateAutomation } from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { automations } from '../schema/index.js';

// Lib
import { AppError, NotFoundError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'db/repositories/automations.repository.ts';

export class AutomationsRepository {
  constructor(private readonly db: DB) {}

  findAll(): Automation[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(automations).orderBy(asc(automations.sortOrder)).all() as Automation[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query automations', { cause: error });
    }
  }

  findById(id: string): Automation | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(automations).where(eq(automations.id, id)).get();
      return (row as Automation) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query automation', { cause: error });
    }
  }

  findByIdOrThrow(id: string): Automation {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Automation', id);
    }
    return row;
  }

  findByProjectOrGlobal(projectId: string): Automation[] {
    const FUNCTION_NAME = 'findByProjectOrGlobal';
    try {
      const rows = this.db
        .select()
        .from(automations)
        .where(or(eq(automations.projectId, projectId), isNull(automations.projectId)))
        .orderBy(asc(automations.sortOrder))
        .all();
      return rows as Automation[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query automations by project', { cause: error });
    }
  }

  insert(data: CreateAutomation): Automation {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db.insert(automations).values(data).returning().get();
      return result as Automation;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert automation', { cause: error });
    }
  }

  update(id: string, data: UpdateAutomation): Automation {
    const FUNCTION_NAME = 'update';
    try {
      const result = this.db
        .update(automations)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(automations.id, id))
        .returning()
        .get();
      return result as Automation;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update automation', { cause: error });
    }
  }

  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(automations).where(eq(automations.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete automation', { cause: error });
    }
  }
}
