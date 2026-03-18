import { eq } from 'drizzle-orm';
import type { DB } from '../index.js';
import { tasks } from '../schema/index.js';
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';
import type { CreateTask, UpdateTask, Task } from '@my-agents/shared';

const FILE_PATH = 'db/repositories/tasks.repository.ts';

function parseTags(row: unknown): Task {
  const r = row as Record<string, unknown>;
  const rawTags = r.tags;
  return {
    ...r,
    tags: typeof rawTags === 'string' ? JSON.parse(rawTags) : rawTags ?? null,
  } as Task;
}

export class TasksRepository {
  constructor(private readonly db: DB) {}

  findAll(): Task[] {
    const FUNCTION_NAME = 'findAll';
    try {
      const rows = this.db.select().from(tasks).all();
      return rows.map((r) => parseTags(r));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query tasks', { cause: error });
    }
  }

  findById(id: string): Task | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(tasks).where(eq(tasks.id, id)).get();
      if (!row) return null;
      return parseTags(row);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query task', { cause: error });
    }
  }

  findByIdOrThrow(id: string): Task {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Task', id);
    }
    return row;
  }

  insert(data: CreateTask): Task {
    const FUNCTION_NAME = 'insert';
    try {
      const { tags, ...rest } = data;
      const values = { ...rest, tags: tags ? JSON.stringify(tags) : null };
      const result = this.db.insert(tasks).values(values).returning().get();
      return parseTags(result);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert task', { cause: error });
    }
  }

  update(id: string, data: UpdateTask): Task {
    const FUNCTION_NAME = 'update';
    try {
      const { tags, ...rest } = data;
      const setValues: Record<string, unknown> = {
        ...rest,
        updatedAt: new Date().toISOString(),
      };
      if (tags !== undefined) {
        setValues.tags = tags ? JSON.stringify(tags) : null;
      }
      const result = this.db
        .update(tasks)
        .set(setValues)
        .where(eq(tasks.id, id))
        .returning()
        .get();
      return parseTags(result);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update task', { cause: error });
    }
  }

  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(tasks).where(eq(tasks.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete task', { cause: error });
    }
  }
}
