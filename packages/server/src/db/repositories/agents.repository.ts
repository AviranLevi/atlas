// External
import { and, eq } from 'drizzle-orm';

// Shared
import type { Agent, CreateAgent, Project, Rule, Skill, UpdateAgent } from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import {
  agentProjects,
  agentRules,
  agentSkills,
  agents,
  globalInstructions,
  memory,
  projects,
  rules,
  skills,
} from '../schema/index.js';

// Lib
import { AppError, NotFoundError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';
import { parseTags } from '../../lib/utils/index.js';

const FILE_PATH = 'db/repositories/agents.repository.ts';

export class AgentsRepository {
  constructor(private readonly db: DB) {}

  /** Returns all agents. */
  findAll(): Agent[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(agents).all() as Agent[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agents', { cause: error });
    }
  }

  /** Returns an agent by ID, or null if not found. */
  findById(id: string): Agent | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(agents).where(eq(agents.id, id)).get();
      return (row as Agent) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent', { cause: error });
    }
  }

  /** Returns an agent by ID, or throws NotFoundError. */
  findByIdOrThrow(id: string): Agent {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Agent', id);
    }
    return row;
  }

  /** Inserts a new agent and returns the created record. */
  insert(data: CreateAgent): Agent {
    const FUNCTION_NAME = 'insert';
    try {
      const result = this.db.insert(agents).values(data).returning().get();
      return result as Agent;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert agent', { cause: error });
    }
  }

  /** Updates an agent and returns the updated record. */
  update(id: string, data: UpdateAgent): Agent {
    const FUNCTION_NAME = 'update';
    try {
      const result = this.db
        .update(agents)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(agents.id, id))
        .returning()
        .get();
      return result as Agent;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update agent', { cause: error });
    }
  }

  /** Deletes an agent by ID. */
  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(agents).where(eq(agents.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete agent', { cause: error });
    }
  }

  /** Returns skills linked to an agent, resolved from the skills table. */
  findSkillsByAgentId(agentId: string): Skill[] {
    const FUNCTION_NAME = 'findSkillsByAgentId';
    try {
      const agentSkillRows = this.db
        .select({ skillId: agentSkills.skillId })
        .from(agentSkills)
        .where(eq(agentSkills.agentId, agentId))
        .all();
      const resolved: Skill[] = [];
      for (const r of agentSkillRows) {
        const row = this.db.select().from(skills).where(eq(skills.id, r.skillId)).get();
        if (row) resolved.push(row as Skill);
      }
      return resolved;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent skills', { cause: error });
    }
  }

  /** Returns rules linked to an agent with tags parsed. */
  findRulesByAgentId(agentId: string): Rule[] {
    const FUNCTION_NAME = 'findRulesByAgentId';
    try {
      const agentRuleRows = this.db
        .select({ ruleId: agentRules.ruleId })
        .from(agentRules)
        .where(eq(agentRules.agentId, agentId))
        .all();
      const resolved: Rule[] = [];
      for (const r of agentRuleRows) {
        const row = this.db.select().from(rules).where(eq(rules.id, r.ruleId)).get();
        if (row) {
          resolved.push({ ...row, tags: parseTags(row.tags) } as Rule);
        }
      }
      return resolved;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent rules', { cause: error });
    }
  }

  /** Returns memory rows scoped to an agent. */
  findMemoriesByAgentId(agentId: string): Record<string, unknown>[] {
    const FUNCTION_NAME = 'findMemoriesByAgentId';
    try {
      return this.db.select().from(memory).where(eq(memory.agentId, agentId)).all() as Record<string, unknown>[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent memories', { cause: error });
    }
  }

  /** Returns global instructions as a single joined string. */
  findGlobalInstructions(): string {
    const FUNCTION_NAME = 'findGlobalInstructions';
    try {
      const globalInstructionRows = this.db.select().from(globalInstructions).all();
      return globalInstructionRows
        .map((r) => r.content)
        .filter(Boolean)
        .join('\n\n');
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query global instructions', { cause: error });
    }
  }

  /** Returns skills scoped to a project. */
  findSkillsByProjectId(projectId: string): Skill[] {
    const FUNCTION_NAME = 'findSkillsByProjectId';
    try {
      return this.db.select().from(skills).where(eq(skills.projectId, projectId)).all() as Skill[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query project skills', { cause: error });
    }
  }

  /** Returns rules scoped to a project with tags parsed. */
  findRulesByProjectId(projectId: string): Rule[] {
    const FUNCTION_NAME = 'findRulesByProjectId';
    try {
      const projectRuleRows = this.db.select().from(rules).where(eq(rules.projectId, projectId)).all();
      return projectRuleRows.map((row) => ({
        ...row,
        tags: parseTags(row.tags),
      })) as Rule[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query project rules', { cause: error });
    }
  }

  /** Returns projects linked to an agent with junction role. */
  findProjectsByAgentId(agentId: string): (Project & { role: string | null })[] {
    const FUNCTION_NAME = 'findProjectsByAgentId';
    try {
      const projectRows = this.db.select().from(agentProjects).where(eq(agentProjects.agentId, agentId)).all();
      const result: (Project & { role: string | null })[] = [];
      for (const row of projectRows) {
        const project = this.db.select().from(projects).where(eq(projects.id, row.projectId)).get();
        if (project) {
          result.push({ ...(project as Project), role: row.role });
        }
      }
      return result;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent projects', { cause: error });
    }
  }

  /** Lists agents assigned to a project with role. */
  findAgentsByProjectIdWithRole(projectId: string): (Agent & { role: string | null })[] {
    const FUNCTION_NAME = 'findAgentsByProjectIdWithRole';
    try {
      const rows = this.db.select().from(agentProjects).where(eq(agentProjects.projectId, projectId)).all();
      const result: (Agent & { role: string | null })[] = [];
      for (const row of rows) {
        const agent = this.db.select().from(agents).where(eq(agents.id, row.agentId)).get();
        if (agent) {
          result.push({ ...(agent as Agent), role: row.role });
        }
      }
      return result;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agents by project', { cause: error });
    }
  }

  /** Returns whether an agent–project link exists. */
  findAgentProject(agentId: string, projectId: string): { role: string | null } | null {
    const FUNCTION_NAME = 'findAgentProject';
    try {
      const row = this.db
        .select()
        .from(agentProjects)
        .where(and(eq(agentProjects.agentId, agentId), eq(agentProjects.projectId, projectId)))
        .get();
      return row ? { role: row.role } : null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent project link', { cause: error });
    }
  }

  /** Inserts an agent–project assignment. */
  insertAgentProject(agentId: string, projectId: string, role: string | null): void {
    const FUNCTION_NAME = 'insertAgentProject';
    try {
      this.db.insert(agentProjects).values({ agentId, projectId, role }).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert agent project link', { cause: error });
    }
  }

  /** Removes an agent–project assignment. */
  deleteAgentProject(agentId: string, projectId: string): void {
    const FUNCTION_NAME = 'deleteAgentProject';
    try {
      this.db
        .delete(agentProjects)
        .where(and(eq(agentProjects.agentId, agentId), eq(agentProjects.projectId, projectId)))
        .run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete agent project link', { cause: error });
    }
  }

  /** Updates role on an agent–project link. */
  updateAgentProjectRole(agentId: string, projectId: string, role: string | null): void {
    const FUNCTION_NAME = 'updateAgentProjectRole';
    try {
      this.db
        .update(agentProjects)
        .set({ role })
        .where(and(eq(agentProjects.agentId, agentId), eq(agentProjects.projectId, projectId)))
        .run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update agent project role', { cause: error });
    }
  }

  /** Returns whether an agent–skill link exists. */
  findAgentSkill(agentId: string, skillId: string): boolean {
    const FUNCTION_NAME = 'findAgentSkill';
    try {
      const row = this.db
        .select()
        .from(agentSkills)
        .where(and(eq(agentSkills.agentId, agentId), eq(agentSkills.skillId, skillId)))
        .get();
      return row != null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent skill link', { cause: error });
    }
  }

  /** Inserts an agent–skill link. */
  insertAgentSkill(agentId: string, skillId: string): void {
    const FUNCTION_NAME = 'insertAgentSkill';
    try {
      this.db.insert(agentSkills).values({ agentId, skillId }).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert agent skill link', { cause: error });
    }
  }

  /** Removes an agent–skill link. */
  deleteAgentSkill(agentId: string, skillId: string): void {
    const FUNCTION_NAME = 'deleteAgentSkill';
    try {
      this.db
        .delete(agentSkills)
        .where(and(eq(agentSkills.agentId, agentId), eq(agentSkills.skillId, skillId)))
        .run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete agent skill link', { cause: error });
    }
  }

  /** Returns whether an agent–rule link exists. */
  findAgentRule(agentId: string, ruleId: string): boolean {
    const FUNCTION_NAME = 'findAgentRule';
    try {
      const row = this.db
        .select()
        .from(agentRules)
        .where(and(eq(agentRules.agentId, agentId), eq(agentRules.ruleId, ruleId)))
        .get();
      return row != null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query agent rule link', { cause: error });
    }
  }

  /** Inserts an agent–rule link. */
  insertAgentRule(agentId: string, ruleId: string): void {
    const FUNCTION_NAME = 'insertAgentRule';
    try {
      this.db.insert(agentRules).values({ agentId, ruleId }).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert agent rule link', { cause: error });
    }
  }

  /** Removes an agent–rule link. */
  deleteAgentRule(agentId: string, ruleId: string): void {
    const FUNCTION_NAME = 'deleteAgentRule';
    try {
      this.db
        .delete(agentRules)
        .where(and(eq(agentRules.agentId, agentId), eq(agentRules.ruleId, ruleId)))
        .run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete agent rule link', { cause: error });
    }
  }
}
