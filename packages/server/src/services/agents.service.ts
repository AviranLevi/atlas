// NPM
import { eq, and, isNull, or } from 'drizzle-orm';
// Utils
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';
// DB
import { agentsRepository } from '../db/repositories/index.js';
import { db } from '../db/index.js';
import { agentSkills, agentRules, agentProjects, skills, rules, memory, globalInstructions } from '../db/schema/index.js';
// Types
import type { Agent, CreateAgent, UpdateAgent } from '@my-agents/shared';

const FILE_PATH = 'services/agents.service.ts';

export class AgentsService {
  constructor(private readonly repo = agentsRepository) {}

  /**
   * Retrieves all agents.
   */
  async list(): Promise<Agent[]> {
    const FUNCTION_NAME = 'list';
    try {
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list agents', { cause: error });
    }
  }

  /**
   * Retrieves an agent by ID.
   * @param id - The agent UUID.
   */
  async getById(id: string): Promise<Agent> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get agent', { cause: error });
    }
  }

  /**
   * Creates a new agent.
   * @param data - The agent creation data.
   */
  async create(data: CreateAgent): Promise<Agent> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create agent', { cause: error });
    }
  }

  /**
   * Updates an agent by ID.
   * @param id - The agent UUID.
   * @param data - The partial update data.
   */
  async update(id: string, data: UpdateAgent): Promise<Agent> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update agent', { cause: error });
    }
  }

  /**
   * Deletes an agent by ID.
   * @param id - The agent UUID.
   */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete agent', { cause: error });
    }
  }

  /**
   * Lists agents assigned to a project, including their role.
   */
  async listByProject(projectId: string): Promise<(Agent & { role: string | null })[]> {
    const FUNCTION_NAME = 'listByProject';
    try {
      const rows = db
        .select()
        .from(agentProjects)
        .where(eq(agentProjects.projectId, projectId))
        .all();

      const result: (Agent & { role: string | null })[] = [];
      for (const row of rows) {
        const agent = await this.getById(row.agentId);
        result.push({ ...agent, role: row.role });
      }
      return result;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list agents by project', { cause: error });
    }
  }

  /**
   * Assigns an agent to a project with an optional role.
   */
  async assignToProject(agentId: string, projectId: string, role?: string | null): Promise<void> {
    const FUNCTION_NAME = 'assignToProject';
    try {
      const existing = db
        .select()
        .from(agentProjects)
        .where(and(eq(agentProjects.agentId, agentId), eq(agentProjects.projectId, projectId)))
        .get();
      if (existing) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - agent ${agentId} already assigned to project ${projectId}`);
        return;
      }
      db.insert(agentProjects).values({ agentId, projectId, role: role ?? null }).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to assign agent to project', { cause: error });
    }
  }

  /**
   * Unassigns an agent from a project.
   */
  async unassignFromProject(agentId: string, projectId: string): Promise<void> {
    const FUNCTION_NAME = 'unassignFromProject';
    try {
      db.delete(agentProjects)
        .where(and(eq(agentProjects.agentId, agentId), eq(agentProjects.projectId, projectId)))
        .run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to unassign agent from project', { cause: error });
    }
  }

  /**
   * Updates an agent's role within a project.
   */
  async updateProjectRole(agentId: string, projectId: string, role: string | null): Promise<void> {
    const FUNCTION_NAME = 'updateProjectRole';
    try {
      db.update(agentProjects)
        .set({ role })
        .where(and(eq(agentProjects.agentId, agentId), eq(agentProjects.projectId, projectId)))
        .run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update agent project role', { cause: error });
    }
  }

  /**
   * Returns the full context for an agent: profile, global instructions,
   * assigned skills/rules, and agent-scoped memories.
   * When projectId is provided, also returns project-scoped skills and rules.
   */
  async getContext(agentId: string, projectId?: string) {
    const FUNCTION_NAME = 'getContext';
    try {
      const agent = await this.getById(agentId);

      const agentSkillRows = db
        .select({ skillId: agentSkills.skillId })
        .from(agentSkills)
        .where(eq(agentSkills.agentId, agentId))
        .all();
      const resolvedSkills = agentSkillRows
        .map((r) => db.select().from(skills).where(eq(skills.id, r.skillId)).get())
        .filter(Boolean);

      const agentRuleRows = db
        .select({ ruleId: agentRules.ruleId })
        .from(agentRules)
        .where(eq(agentRules.agentId, agentId))
        .all();
      const ruleIds = agentRuleRows.map((r) => r.ruleId);
      const resolvedRules = ruleIds.length
        ? ruleIds
            .map((rid) => {
              const row = db.select().from(rules).where(eq(rules.id, rid)).get();
              if (!row) return null;
              return { ...row, tags: JSON.parse(row.tags ?? '[]') };
            })
            .filter(Boolean)
        : [];

      const memories = db
        .select()
        .from(memory)
        .where(eq(memory.agentId, agentId))
        .all();

      const globalInstructionRows = db.select().from(globalInstructions).all();
      const globalInstructionsContent = globalInstructionRows
        .map((r) => r.content)
        .filter(Boolean)
        .join('\n\n');

      // Fetch project-scoped skills and rules when projectId is provided
      let projectSkills: typeof resolvedSkills = [];
      let projectRules: typeof resolvedRules = [];

      if (projectId) {
        projectSkills = db
          .select()
          .from(skills)
          .where(eq(skills.projectId, projectId))
          .all();

        const projectRuleRows = db
          .select()
          .from(rules)
          .where(eq(rules.projectId, projectId))
          .all();
        projectRules = projectRuleRows.map((row) => ({
          ...row,
          tags: JSON.parse(row.tags ?? '[]'),
        }));
      }

      return {
        agent,
        globalInstructions: globalInstructionsContent,
        skills: resolvedSkills,
        rules: resolvedRules,
        projectSkills,
        projectRules,
        memories,
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get agent context', { cause: error });
    }
  }
}
