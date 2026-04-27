// Shared
import type { Agent, CreateAgent, Rule, Skill, UpdateAgent } from '@atlas/shared';

// Repositories
import { agentsRepository } from '../../db/repositories/index.js';

// Lib
import type { AgentContext, AgentDetail } from './agents.types.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/agents/agents.service.ts';

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

  /**
   * Deletes an agent by ID.
   *
   * Schema-level FKs:
   *   - `tasks.agent_id` is RESTRICT — we pre-check the count and throw a 409
   *     with a precise `{ agentName, taskCount }` payload so the UI can render
   *     a useful confirmation/reassignment flow instead of a raw FK error.
   *   - `workspaces.agent_id`, `reviews.reviewer_id`, `agents.provider_id` and
   *     `chat_conversations.provider_id` are SET NULL — historical rows survive
   *     and the UI surfaces a "(deleted agent)" / "disconnected" state.
   *   - `heartbeat_configs.agent_id`, `memory.agent_id`, `agent_skills`,
   *     `agent_resources`, `agent_projects`, `dispatch_rules.agent_id` are
   *     CASCADE — junction rows and per-agent config disappear with the agent.
   */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      const agent = this.repo.findByIdOrThrow(id);
      const taskCount = this.repo.countAssignedTasks(id);
      if (taskCount > 0) {
        throw new AppError(
          `Cannot delete "${agent.name}" — ${taskCount} active task(s) still assigned. Reassign or delete those tasks first.`,
          {
            status: 409,
            cause: { agentId: id, agentName: agent.name, taskCount },
          },
        );
      }
      this.repo.remove(id);
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      // TOCTOU: a task can be assigned between the count pre-check and the
      // DELETE. SQLite then raises a generic "FOREIGN KEY constraint failed".
      // Translate that to the same 409 contract the pre-check uses so the
      // client renders a sensible toast instead of a 500 "Failed to delete".
      if (error instanceof Error && /FOREIGN KEY/i.test(error.message)) {
        throw new AppError('Cannot delete agent — task assignment changed during delete. Refresh and retry.', {
          status: 409,
          cause: { agentId: id },
        });
      }
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete agent', { cause: error });
    }
  }

  /** Lists agents assigned to a project, including their role. */
  async listByProject(projectId: string): Promise<(Agent & { role: string | null })[]> {
    const FUNCTION_NAME = 'listByProject';
    try {
      return this.repo.findAgentsByProjectIdWithRole(projectId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list agents by project', { cause: error });
    }
  }

  /** Assigns an agent to a project with an optional role. */
  async assignToProject(agentId: string, projectId: string, role?: string | null): Promise<void> {
    const FUNCTION_NAME = 'assignToProject';
    try {
      const existing = this.repo.findAgentProject(agentId, projectId);
      if (existing) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - agent ${agentId} already assigned to project ${projectId}`);
        return;
      }
      this.repo.insertAgentProject(agentId, projectId, role ?? null);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to assign agent to project', { cause: error });
    }
  }

  /** Unassigns an agent from a project. */
  async unassignFromProject(agentId: string, projectId: string): Promise<void> {
    const FUNCTION_NAME = 'unassignFromProject';
    try {
      this.repo.deleteAgentProject(agentId, projectId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to unassign agent from project', { cause: error });
    }
  }

  /** Updates an agent's role within a project. */
  async updateProjectRole(agentId: string, projectId: string, role: string | null): Promise<void> {
    const FUNCTION_NAME = 'updateProjectRole';
    try {
      this.repo.updateAgentProjectRole(agentId, projectId, role);
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
  async getContext(agentId: string, projectId?: string): Promise<AgentContext> {
    const FUNCTION_NAME = 'getContext';
    try {
      const agent = await this.getById(agentId);
      const resolvedSkills = this.repo.findSkillsByAgentId(agentId);
      const resolvedRules = this.repo.findRulesByAgentId(agentId);
      const memories = this.repo.findMemoriesByAgentId(agentId);
      const globalInstructionsContent = this.repo.findGlobalInstructions();

      let projectSkills: Skill[] = [];
      let projectRules: Rule[] = [];
      if (projectId) {
        projectSkills = this.repo.findSkillsByProjectId(projectId);
        projectRules = this.repo.findRulesByProjectId(projectId);
      }

      return {
        agent,
        globalInstructions: globalInstructionsContent,
        skills: resolvedSkills as Record<string, unknown>[],
        rules: resolvedRules as Record<string, unknown>[],
        projectSkills: projectSkills as Record<string, unknown>[],
        projectRules: projectRules as Record<string, unknown>[],
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
      return this.repo.findSkillsByAgentId(agentId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list agent skills', { cause: error });
    }
  }

  /** Attaches a skill to an agent (idempotent). */
  async attachSkill(agentId: string, skillId: string): Promise<void> {
    const FUNCTION_NAME = 'attachSkill';
    try {
      if (this.repo.findAgentSkill(agentId, skillId)) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - skill ${skillId} already attached to agent ${agentId}`);
        return;
      }
      this.repo.insertAgentSkill(agentId, skillId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to attach skill to agent', { cause: error });
    }
  }

  /** Detaches a skill from an agent. */
  async detachSkill(agentId: string, skillId: string): Promise<void> {
    const FUNCTION_NAME = 'detachSkill';
    try {
      this.repo.deleteAgentSkill(agentId, skillId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to detach skill from agent', { cause: error });
    }
  }

  /** Lists rules attached to an agent. */
  async listRules(agentId: string): Promise<Rule[]> {
    const FUNCTION_NAME = 'listRules';
    try {
      return this.repo.findRulesByAgentId(agentId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list agent rules', { cause: error });
    }
  }

  /** Attaches a rule to an agent (idempotent). */
  async attachRule(agentId: string, ruleId: string): Promise<void> {
    const FUNCTION_NAME = 'attachRule';
    try {
      if (this.repo.findAgentRule(agentId, ruleId)) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - rule ${ruleId} already attached to agent ${agentId}`);
        return;
      }
      this.repo.insertAgentRule(agentId, ruleId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to attach rule to agent', { cause: error });
    }
  }

  /** Detaches a rule from an agent. */
  async detachRule(agentId: string, ruleId: string): Promise<void> {
    const FUNCTION_NAME = 'detachRule';
    try {
      this.repo.deleteAgentRule(agentId, ruleId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to detach rule from agent', { cause: error });
    }
  }

  /** Returns agent detail with skills, rules, and projects. */
  async getDetail(agentId: string): Promise<AgentDetail> {
    const FUNCTION_NAME = 'getDetail';
    try {
      const agent = await this.getById(agentId);
      const agentSkillsList = this.repo.findSkillsByAgentId(agentId);
      const agentRulesList = this.repo.findRulesByAgentId(agentId);
      const agentProjectsList = this.repo.findProjectsByAgentId(agentId);

      return {
        agent,
        skills: agentSkillsList,
        rules: agentRulesList,
        projects: agentProjectsList as Record<string, unknown>[],
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get agent detail', { cause: error });
    }
  }
}
