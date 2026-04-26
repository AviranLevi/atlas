// Shared
import type { Agent, CreateAgent, Project, Rule, Skill, UpdateAgent } from '@atlas/shared';

// DB
import type { DB } from '../../index.js';

// Lib
import { NotFoundError } from '../../../lib/errors.js';

// Local
import * as memoryQ from './agent-memory.queries.js';
import * as projectsQ from './agent-projects.queries.js';
import * as rulesQ from './agent-rules.queries.js';
import * as skillsQ from './agent-skills.queries.js';
import * as crud from './agents.crud.js';

export class AgentsRepository {
  constructor(private readonly db: DB) {}

  /** Returns all agents. */
  findAll(): Agent[] {
    return crud.findAll(this.db);
  }

  /** Returns an agent by ID, or null if not found. */
  findById(id: string): Agent | null {
    return crud.findById(this.db, id);
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
    return crud.insert(this.db, data);
  }

  /** Updates an agent and returns the updated record. */
  update(id: string, data: UpdateAgent): Agent {
    return crud.update(this.db, id, data);
  }

  /** Deletes an agent by ID. */
  remove(id: string): void {
    crud.remove(this.db, id);
  }

  /** Returns global instructions as a single joined string. */
  findGlobalInstructions(): string {
    return crud.findGlobalInstructions(this.db);
  }

  /** Returns skills linked to an agent, resolved from the skills table. */
  findSkillsByAgentId(agentId: string): Skill[] {
    return skillsQ.findSkillsByAgentId(this.db, agentId);
  }

  /** Returns skills scoped to a project. */
  findSkillsByProjectId(projectId: string): Skill[] {
    return skillsQ.findSkillsByProjectId(this.db, projectId);
  }

  /** Returns whether an agent–skill link exists. */
  findAgentSkill(agentId: string, skillId: string): boolean {
    return skillsQ.findAgentSkill(this.db, agentId, skillId);
  }

  /** Inserts an agent–skill link. */
  insertAgentSkill(agentId: string, skillId: string): void {
    skillsQ.insertAgentSkill(this.db, agentId, skillId);
  }

  /** Removes an agent–skill link. */
  deleteAgentSkill(agentId: string, skillId: string): void {
    skillsQ.deleteAgentSkill(this.db, agentId, skillId);
  }

  /** Returns rules linked to an agent with tags parsed. */
  findRulesByAgentId(agentId: string): Rule[] {
    return rulesQ.findRulesByAgentId(this.db, agentId);
  }

  /** Returns rules scoped to a project with tags parsed. */
  findRulesByProjectId(projectId: string): Rule[] {
    return rulesQ.findRulesByProjectId(this.db, projectId);
  }

  /** Returns whether an agent–rule link exists. */
  findAgentRule(agentId: string, ruleId: string): boolean {
    return rulesQ.findAgentRule(this.db, agentId, ruleId);
  }

  /** Inserts an agent–rule link. */
  insertAgentRule(agentId: string, ruleId: string): void {
    rulesQ.insertAgentRule(this.db, agentId, ruleId);
  }

  /** Removes an agent–rule link. */
  deleteAgentRule(agentId: string, ruleId: string): void {
    rulesQ.deleteAgentRule(this.db, agentId, ruleId);
  }

  /** Returns memory rows scoped to an agent. */
  findMemoriesByAgentId(agentId: string): Record<string, unknown>[] {
    return memoryQ.findMemoriesByAgentId(this.db, agentId);
  }

  /** Returns projects linked to an agent with junction role. */
  findProjectsByAgentId(agentId: string): (Project & { role: string | null })[] {
    return projectsQ.findProjectsByAgentId(this.db, agentId);
  }

  /** Lists agents assigned to a project with role. */
  findAgentsByProjectIdWithRole(projectId: string): (Agent & { role: string | null })[] {
    return projectsQ.findAgentsByProjectIdWithRole(this.db, projectId);
  }

  /** Returns whether an agent–project link exists. */
  findAgentProject(agentId: string, projectId: string): { role: string | null } | null {
    return projectsQ.findAgentProject(this.db, agentId, projectId);
  }

  /** Inserts an agent–project assignment. */
  insertAgentProject(agentId: string, projectId: string, role: string | null): void {
    projectsQ.insertAgentProject(this.db, agentId, projectId, role);
  }

  /** Removes an agent–project assignment. */
  deleteAgentProject(agentId: string, projectId: string): void {
    projectsQ.deleteAgentProject(this.db, agentId, projectId);
  }

  /** Updates role on an agent–project link. */
  updateAgentProjectRole(agentId: string, projectId: string, role: string | null): void {
    projectsQ.updateAgentProjectRole(this.db, agentId, projectId, role);
  }
}
