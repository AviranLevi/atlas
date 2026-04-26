// Shared
import type { CreateSkill, Skill, UpdateSkill } from '@atlas/shared';

// Repositories
import { skillsRepository } from '../../db/repositories/index.js';

// Services
import { createResourceCrud } from '../shared/resource-crud.js';

// Lib
import { withAppError } from '../../lib/with-app-error.js';
import type { SkillDetail } from './skills.types.js';

const FILE_PATH = 'services/skills/skills.service.ts';

export class SkillsService {
  private readonly crud;

  constructor(private readonly repo = skillsRepository) {
    this.crud = createResourceCrud<Skill, CreateSkill, UpdateSkill>(this.repo, {
      resourceName: 'skill',
      filePath: FILE_PATH,
    });
  }

  /**
   * Retrieves all skills, optionally filtered by projectId.
   * When projectId is provided, returns skills where projectId matches OR projectId is null (global).
   */
  list(filters?: { projectId?: string; type?: string }): Promise<Skill[]> {
    return this.crud.list(filters);
  }

  /** Returns a skill by ID. */
  getById(id: string): Promise<Skill> {
    return this.crud.getById(id);
  }

  /** Creates a new skill. */
  create(data: CreateSkill): Promise<Skill> {
    return this.crud.create(data);
  }

  /** Updates a skill by ID. */
  update(id: string, data: UpdateSkill): Promise<Skill> {
    return this.crud.update(id, data);
  }

  /** Deletes a skill by ID. */
  delete(id: string): Promise<void> {
    return this.crud.remove(id);
  }

  /** Returns a skill with its associated agents. */
  getDetail(skillId: string): Promise<SkillDetail> {
    return withAppError(
      async () => {
        const skill = await this.getById(skillId);
        const agentsList = this.repo.findAgentsBySkillId(skillId);
        return { skill, agents: agentsList };
      },
      { filePath: FILE_PATH, functionName: 'getDetail', message: 'Failed to get skill detail' },
    );
  }
}
