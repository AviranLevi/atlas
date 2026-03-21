import { eq, sql } from 'drizzle-orm';
import type { DB } from '../index.js';
import { phases, tasks } from '../schema/index.js';
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';
import type { Phase, CreatePhase, UpdatePhase } from '@my-agents/shared';

const FILE_PATH = 'db/repositories/phases.repository.ts';

export class PhasesRepository {
  constructor(private readonly db: DB) {}

  findAll(): Phase[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(phases).all() as Phase[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query phases', { cause: error });
    }
  }

  findByProjectId(projectId: string): Phase[] {
    const FUNCTION_NAME = 'findByProjectId';
    try {
      const rows = this.db
        .select({
          id: phases.id,
          projectId: phases.projectId,
          name: phases.name,
          description: phases.description,
          status: phases.status,
          orderIndex: phases.orderIndex,
          createdAt: phases.createdAt,
          updatedAt: phases.updatedAt,
          taskCount: sql<number>`count(${tasks.id})`.as('task_count'),
          doneCount: sql<number>`sum(case when ${tasks.status} = 'Done' then 1 else 0 end)`.as('done_count'),
        })
        .from(phases)
        .leftJoin(tasks, eq(tasks.phaseId, phases.id))
        .where(eq(phases.projectId, projectId))
        .groupBy(phases.id)
        .orderBy(phases.orderIndex)
        .all();
      return rows as Phase[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query phases for project', { cause: error });
    }
  }

  findById(id: string): Phase | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(phases).where(eq(phases.id, id)).get();
      return (row as Phase) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query phase', { cause: error });
    }
  }

  findByIdOrThrow(id: string): Phase {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Phase', id);
    }
    return row;
  }

  insert(data: CreatePhase): Phase {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db.insert(phases).values(data).returning().get();
      return result as Phase;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert phase', { cause: error });
    }
  }

  update(id: string, data: UpdatePhase): Phase {
    const FUNCTION_NAME = 'update';
    try {
      const result = this.db
        .update(phases)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(phases.id, id))
        .returning()
        .get();
      return result as Phase;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update phase', { cause: error });
    }
  }

  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      // Nullify tasks' phaseId before deleting
      this.db.update(tasks).set({ phaseId: null }).where(eq(tasks.phaseId, id)).run();
      this.db.delete(phases).where(eq(phases.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete phase', { cause: error });
    }
  }
}
