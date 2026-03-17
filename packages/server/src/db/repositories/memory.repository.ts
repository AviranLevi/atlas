import { eq } from 'drizzle-orm';
import type { DB } from '../index.js';
import { memory } from '../schema/index.js';
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';
import type { CreateMemory, UpdateMemory, Memory } from '@my-agents/shared';

const FILE_PATH = 'db/repositories/memory.repository.ts';

export class MemoryRepository {
  constructor(private readonly db: DB) {}

  findAll(): Memory[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(memory).all() as Memory[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query memory', { cause: error });
    }
  }

  findById(id: string): Memory | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(memory).where(eq(memory.id, id)).get();
      return (row as Memory) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query memory', { cause: error });
    }
  }

  findByIdOrThrow(id: string): Memory {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Memory', id);
    }
    return row;
  }

  insert(data: CreateMemory): Memory {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db.insert(memory).values(data).returning().get();
      return result as Memory;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert memory', { cause: error });
    }
  }

  update(id: string, data: UpdateMemory): Memory {
    const FUNCTION_NAME = 'update';
    try {
      const result = this.db
        .update(memory)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(memory.id, id))
        .returning()
        .get();
      return result as Memory;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update memory', { cause: error });
    }
  }

  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(memory).where(eq(memory.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete memory', { cause: error });
    }
  }
}
