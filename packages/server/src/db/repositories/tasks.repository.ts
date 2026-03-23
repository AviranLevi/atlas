// External
import { eq, and } from 'drizzle-orm';

// Shared
import type { CreateTask, UpdateTask, Task } from '@my-agents/shared';

// DB
import type { DB } from '../index.js';
import { tasks } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';

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

  /** Returns all tasks with tags JSON parsed. */
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

  /** Returns tasks matching any combination of status, projectId, and agentId filters. */
  findByFilters(filters: { status?: string; projectId?: string; agentId?: string }): Task[] {
    const FUNCTION_NAME = 'findByFilters';
    try {
      const conditions = [];
      if (filters.status) conditions.push(eq(tasks.status, filters.status));
      if (filters.projectId) conditions.push(eq(tasks.projectId, filters.projectId));
      if (filters.agentId) conditions.push(eq(tasks.agentId, filters.agentId));

      const rows = this.db
        .select()
        .from(tasks)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .all();
      return rows.map((r) => parseTags(r));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query tasks', { cause: error });
    }
  }

  /** Returns a task by ID with tags JSON parsed, or null if not found. */
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

  /** Returns a task by ID with tags JSON parsed, or throws NotFoundError. */
  findByIdOrThrow(id: string): Task {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Task', id);
    }
    return row;
  }

  /** Inserts a new task with tags serialized to JSON. */
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

  /** Updates a task and returns the updated record. */
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

  /** Deletes a task by ID. */
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
