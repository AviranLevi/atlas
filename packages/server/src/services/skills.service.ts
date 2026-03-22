import { eq, or, isNull } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';
import { skillsRepository } from '../db/repositories/index.js';
import { db } from '../db/index.js';
import { skills } from '../db/schema/index.js';
import type { Skill, CreateSkill, UpdateSkill } from '@my-agents/shared';

const FILE_PATH = 'services/skills.service.ts';

export class SkillsService {
  constructor(private readonly repo = skillsRepository) {}

  /**
   * Retrieves all skills, optionally filtered by projectId.
   * When projectId is provided, returns skills where projectId matches OR projectId is null (global).
   */
  async list(projectId?: string): Promise<Skill[]> {
    const FUNCTION_NAME = 'list';
    try {
      if (projectId) {
        const rows = db
          .select()
          .from(skills)
          .where(or(eq(skills.projectId, projectId), isNull(skills.projectId)))
          .all();
        return rows as Skill[];
      }
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list skills', { cause: error });
    }
  }

  /**
   * Retrieves a skill by ID.
   * @param id - The skill UUID.
   */
  async getById(id: string): Promise<Skill> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get skill', { cause: error });
    }
  }

  /**
   * Creates a new skill.
   * @param data - The skill creation data.
   */
  async create(data: CreateSkill): Promise<Skill> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create skill', { cause: error });
    }
  }

  /**
   * Updates a skill by ID.
   * @param id - The skill UUID.
   * @param data - The partial update data.
   */
  async update(id: string, data: UpdateSkill): Promise<Skill> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update skill', { cause: error });
    }
  }

  /**
   * Deletes a skill by ID.
   * @param id - The skill UUID.
   */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete skill', { cause: error });
    }
  }
}
