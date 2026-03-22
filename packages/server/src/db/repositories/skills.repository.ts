// External
import { eq } from 'drizzle-orm';

// Shared
import type { CreateSkill, UpdateSkill, Skill } from '@my-agents/shared';

// DB
import type { DB } from '../index.js';
import { skills } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';

const FILE_PATH = 'db/repositories/skills.repository.ts';

export class SkillsRepository {
  constructor(private readonly db: DB) {}

  /** Returns all skills. */
  findAll(): Skill[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(skills).all() as Skill[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query skills', { cause: error });
    }
  }

  /** Returns a skill by ID, or null if not found. */
  findById(id: string): Skill | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(skills).where(eq(skills.id, id)).get();
      return (row as Skill) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query skill', { cause: error });
    }
  }

  /** Returns a skill by ID, or throws NotFoundError. */
  findByIdOrThrow(id: string): Skill {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Skill', id);
    }
    return row;
  }

  /** Inserts a new skill and returns the created record. */
  insert(data: CreateSkill): Skill {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db.insert(skills).values(data).returning().get();
      return result as Skill;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert skill', { cause: error });
    }
  }

  /** Updates a skill and returns the updated record. */
  update(id: string, data: UpdateSkill): Skill {
    const FUNCTION_NAME = 'update';
    try {
      const result = this.db
        .update(skills)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(skills.id, id))
        .returning()
        .get();
      return result as Skill;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update skill', { cause: error });
    }
  }

  /** Deletes a skill by ID. */
  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(skills).where(eq(skills.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete skill', { cause: error });
    }
  }
}
