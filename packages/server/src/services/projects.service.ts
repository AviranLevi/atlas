// NPM
import { eq, sql } from 'drizzle-orm';
// Utils
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';
// DB
import { projectsRepository } from '../db/repositories/index.js';
import { db } from '../db/index.js';
import { agentProjects, agents, tasks, memory, projects } from '../db/schema/index.js';
// Types
import type { Project, CreateProject, UpdateProject } from '@my-agents/shared';

const FILE_PATH = 'services/projects.service.ts';

export class ProjectsService {
  constructor(private readonly repo = projectsRepository) {}

  /**
   * Retrieves all projects.
   */
  async list(): Promise<Project[]> {
    const FUNCTION_NAME = 'list';
    try {
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list projects', { cause: error });
    }
  }

  /**
   * Retrieves a project by ID.
   * @param id - The project UUID.
   */
  async getById(id: string): Promise<Project> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get project', { cause: error });
    }
  }

  /**
   * Creates a new project.
   * @param data - The project creation data.
   */
  async create(data: CreateProject): Promise<Project> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create project', { cause: error });
    }
  }

  /**
   * Updates a project by ID.
   * @param id - The project UUID.
   * @param data - The partial update data.
   */
  async update(id: string, data: UpdateProject): Promise<Project> {
    const FUNCTION_NAME = 'update';
    try {
      return this.repo.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update project', { cause: error });
    }
  }

  /**
   * Deletes a project by ID.
   * @param id - The project UUID.
   */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete project', { cause: error });
    }
  }

  /**
   * Retrieves all projects with task count breakdown and agent count.
   */
  async listWithSummary() {
    const FUNCTION_NAME = 'listWithSummary';
    try {
      const allProjects = this.repo.findAll();

      const taskCountRows = db
        .select({
          projectId: tasks.projectId,
          status: tasks.status,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(tasks)
        .groupBy(tasks.projectId, tasks.status)
        .all();

      const agentCountRows = db
        .select({
          projectId: agentProjects.projectId,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(agentProjects)
        .groupBy(agentProjects.projectId)
        .all();

      const taskCountMap = new Map<string, Record<string, number>>();
      for (const row of taskCountRows) {
        if (!row.projectId) continue;
        if (!taskCountMap.has(row.projectId)) taskCountMap.set(row.projectId, {});
        taskCountMap.get(row.projectId)![row.status ?? ''] = Number(row.count);
      }

      const agentCountMap = new Map<string, number>();
      for (const row of agentCountRows) {
        agentCountMap.set(row.projectId, Number(row.count));
      }

      return allProjects.map((p) => {
        const counts = taskCountMap.get(p.id) ?? {};
        const todo = counts['To Do'] ?? 0;
        const inProgress = counts['In Progress'] ?? 0;
        const inReview = counts['In Review'] ?? 0;
        const done = counts['Done'] ?? 0;
        return {
          ...p,
          taskCounts: { todo, inProgress, inReview, done, total: todo + inProgress + inReview + done },
          agentCount: agentCountMap.get(p.id) ?? 0,
        };
      });
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list projects with summary', { cause: error });
    }
  }

  /**
   * Bootstraps a new project with default agents, skills, and memory.
   * @param _projectId - The project UUID to bootstrap.
   */
  async bootstrapProject(_projectId: string): Promise<void> {
    const FUNCTION_NAME = 'bootstrapProject';
    try {
      // TODO: Implement bootstrap logic (create default agents, skills, memory)
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - stub not implemented`);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to bootstrap project', { cause: error });
    }
  }

  /**
   * Exports project-specific Cursor rules.
   * @param _projectId - The project UUID.
   */
  async exportCursorRules(_projectId: string): Promise<string> {
    const FUNCTION_NAME = 'exportCursorRules';
    try {
      // TODO: Implement export logic
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - stub not implemented`);
      return '';
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to export cursor rules', { cause: error });
    }
  }

  /**
   * Returns the full context for a project: details, assigned agents,
   * project tasks, and project-scoped memories.
   */
  async getContext(projectId: string) {
    const FUNCTION_NAME = 'getContext';
    try {
      const project = await this.getById(projectId);

      const agentProjectRows = db
        .select({ agentId: agentProjects.agentId })
        .from(agentProjects)
        .where(eq(agentProjects.projectId, projectId))
        .all();
      const assignedAgents = agentProjectRows
        .map((r) => db.select().from(agents).where(eq(agents.id, r.agentId)).get())
        .filter(Boolean);

      const rawTasks = db
        .select()
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .all();
      const projectTasks = rawTasks.map((t) => ({
        ...t,
        tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags ?? null,
      }));

      const projectMemories = db
        .select()
        .from(memory)
        .where(eq(memory.projectId, projectId))
        .all();

      return {
        project,
        agents: assignedAgents,
        tasks: projectTasks,
        memories: projectMemories,
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get project context', { cause: error });
    }
  }
}
