// External
import { eq, and, isNull, or } from 'drizzle-orm';

// Shared
import type { Agent, CreateAgent, UpdateAgent, Skill, Rule } from '@my-agents/shared';

// DB
import { db } from '../db/index.js';
import { agentSkills, agentRules, agentProjects, skills, rules, memory, globalInstructions, projects } from '../db/schema/index.js';

// Repositories
import { agentsRepository } from '../db/repositories/index.js';

// Lib
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

const FILE_PATH = 'services/agents.service.ts';

export class AgentsService {
  constructor(private readonly repo = agentsRepository) {}

  /** Retrieves all agents. */
  async list(): Promise<Agent[]> {
    const FUNCTION_NAME = 'list';
    try {
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list agents', { cause: error });
    }
  }

  /** Returns an agent by ID. */
  async getById(id: string): Promise<Agent> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get agent', { cause: error });
    }
  }

  /** Creates a new agent. */
  async create(data: CreateAgent): Promise<Agent> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create agent', { cause: error });
    }
  }

  /** Updates an agent by ID. */
  async update(id: string, data: UpdateAgent): Promise<Agent> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update agent', { cause: error });
    }
  }

  /** Deletes an agent by ID. */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete agent', { cause: error });
    }
  }

  /** Lists agents assigned to a project, including their role. */
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

  /** Assigns an agent to a project with an optional role. */
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

  /** Unassigns an agent from a project. */
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

  /** Updates an agent's role within a project. */
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

  /** Lists skills attached to an agent. */
  async listSkills(agentId: string): Promise<Skill[]> {
    const FUNCTION_NAME = 'listSkills';
    try {
      const rows = db
        .select({ skillId: agentSkills.skillId })
        .from(agentSkills)
        .where(eq(agentSkills.agentId, agentId))
        .all();

      const result: Skill[] = [];
      for (const row of rows) {
        const skill = db.select().from(skills).where(eq(skills.id, row.skillId)).get();
        if (skill) result.push(skill as Skill);
      }
      return result;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list agent skills', { cause: error });
    }
  }

  /** Attaches a skill to an agent (idempotent). */
  async attachSkill(agentId: string, skillId: string): Promise<void> {
    const FUNCTION_NAME = 'attachSkill';
    try {
      const existing = db
        .select()
        .from(agentSkills)
        .where(and(eq(agentSkills.agentId, agentId), eq(agentSkills.skillId, skillId)))
        .get();
      if (existing) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - skill ${skillId} already attached to agent ${agentId}`);
        return;
      }
      db.insert(agentSkills).values({ agentId, skillId }).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to attach skill to agent', { cause: error });
    }
  }

  /** Detaches a skill from an agent. */
  async detachSkill(agentId: string, skillId: string): Promise<void> {
    const FUNCTION_NAME = 'detachSkill';
    try {
      db.delete(agentSkills)
        .where(and(eq(agentSkills.agentId, agentId), eq(agentSkills.skillId, skillId)))
        .run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to detach skill from agent', { cause: error });
    }
  }

  /** Lists rules attached to an agent. */
  async listRules(agentId: string): Promise<Rule[]> {
    const FUNCTION_NAME = 'listRules';
    try {
      const rows = db
        .select({ ruleId: agentRules.ruleId })
        .from(agentRules)
        .where(eq(agentRules.agentId, agentId))
        .all();

      const result: Rule[] = [];
      for (const row of rows) {
        const rule = db.select().from(rules).where(eq(rules.id, row.ruleId)).get();
        if (rule) {
          result.push({ ...rule, tags: JSON.parse(rule.tags ?? '[]') } as Rule);
        }
      }
      return result;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list agent rules', { cause: error });
    }
  }

  /** Attaches a rule to an agent (idempotent). */
  async attachRule(agentId: string, ruleId: string): Promise<void> {
    const FUNCTION_NAME = 'attachRule';
    try {
      const existing = db
        .select()
        .from(agentRules)
        .where(and(eq(agentRules.agentId, agentId), eq(agentRules.ruleId, ruleId)))
        .get();
      if (existing) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - rule ${ruleId} already attached to agent ${agentId}`);
        return;
      }
      db.insert(agentRules).values({ agentId, ruleId }).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to attach rule to agent', { cause: error });
    }
  }

  /** Detaches a rule from an agent. */
  async detachRule(agentId: string, ruleId: string): Promise<void> {
    const FUNCTION_NAME = 'detachRule';
    try {
      db.delete(agentRules)
        .where(and(eq(agentRules.agentId, agentId), eq(agentRules.ruleId, ruleId)))
        .run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to detach rule from agent', { cause: error });
    }
  }

  /** Returns agent detail with skills, rules, and projects. */
  async getDetail(agentId: string) {
    const FUNCTION_NAME = 'getDetail';
    try {
      const agent = await this.getById(agentId);
      const agentSkillsList = await this.listSkills(agentId);
      const agentRulesList = await this.listRules(agentId);

      const projectRows = db
        .select()
        .from(agentProjects)
        .where(eq(agentProjects.agentId, agentId))
        .all();

      const agentProjectsList = [];
      for (const row of projectRows) {
        const project = db.select().from(projects).where(eq(projects.id, row.projectId)).get();
        if (project) {
          agentProjectsList.push({ ...project, role: row.role });
        }
      }

      return {
        agent,
        skills: agentSkillsList,
        rules: agentRulesList,
        projects: agentProjectsList,
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get agent detail', { cause: error });
    }
  }
}
