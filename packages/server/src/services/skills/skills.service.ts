// Shared
import type { Skill, CreateSkill, UpdateSkill } from '@my-agents/shared';

// Types
import type { SkillDetail } from './skills.types.js';

// Repositories
import { skillsRepository } from '../../db/repositories/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/skills.service.ts';

export class SkillsService {
  constructor(private readonly repo = skillsRepository) {}

  /**
   * Retrieves all skills, optionally filtered by projectId.
   * When projectId is provided, returns skills where projectId matches OR projectId is null (global).
   */
  async list(filters?: { projectId?: string; type?: string }): Promise<Skill[]> {
    const FUNCTION_NAME = 'list';
    try {
      let result: Skill[];
      if (filters?.projectId) {
        result = this.repo.findByProjectOrGlobal(filters.projectId);
      } else {
        result = this.repo.findAll();
      }
      if (filters?.type) {
        result = result.filter((s) => s.type === filters.type);
      }
      return result;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list skills', { cause: error });
    }
  }

  /** Returns a skill by ID. */
  async getById(id: string): Promise<Skill> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get skill', { cause: error });
    }
  }

  /** Creates a new skill. */
  async create(data: CreateSkill): Promise<Skill> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create skill', { cause: error });
    }
  }

  /** Updates a skill by ID. */
  async update(id: string, data: UpdateSkill): Promise<Skill> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update skill', { cause: error });
    }
  }

  /** Deletes a skill by ID. */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete skill', { cause: error });
    }
  }

  /** Returns a skill with its associated agents. */
  async getDetail(skillId: string): Promise<SkillDetail> {
    const FUNCTION_NAME = 'getDetail';
    try {
      const skill = await this.getById(skillId);
      const agentsList = this.repo.findAgentsBySkillId(skillId);
      return { skill, agents: agentsList };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get skill detail', { cause: error });
    }
  }
}
