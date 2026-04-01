// External
import { eq, isNull, or } from 'drizzle-orm';

// Shared
import type { CreateSkill, Skill, UpdateSkill } from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { agentSkills, agents, skills } from '../schema/index.js';

// Lib
import { AppError, NotFoundError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

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

  /** Returns skills for a project plus global skills (null projectId). */
  findByProjectOrGlobal(projectId: string): Skill[] {
    const FUNCTION_NAME = 'findByProjectOrGlobal';
    try {
      const rows = this.db
        .select()
        .from(skills)
        .where(or(eq(skills.projectId, projectId), isNull(skills.projectId)))
        .all();
      return rows as Skill[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query skills by project', { cause: error });
    }
  }

  /** Returns agents that use this skill. */
  findAgentsBySkillId(skillId: string): { id: string; name: string }[] {
    const FUNCTION_NAME = 'findAgentsBySkillId';
    try {
      const rows = this.db.select().from(agentSkills).where(eq(agentSkills.skillId, skillId)).all();
      const result: { id: string; name: string }[] = [];
      for (const row of rows) {
        const agent = this.db.select().from(agents).where(eq(agents.id, row.agentId)).get();
        if (agent) {
          result.push({ id: agent.id, name: agent.name });
        }
      }
      return result;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agents by skill', { cause: error });
    }
  }
}
