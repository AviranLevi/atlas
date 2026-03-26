// External
import { execSync } from 'child_process';

// Shared
import type { Project, CreateProject, UpdateProject } from '@my-agents/shared';

// Types
import type { ProjectSummary, ProjectContext } from './projects.types.js';

// Repositories
import { projectsRepository } from '../../db/repositories/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/projects/projects.service.ts';

export class ProjectsService {
  constructor(private readonly repo = projectsRepository) {}

  /** Lists all projects. */
  async list(): Promise<Project[]> {
    const FUNCTION_NAME = 'list';
    try {
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list projects', { cause: error });
    }
  }

  /** Returns a project by ID. */
  async getById(id: string): Promise<Project> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get project', { cause: error });
    }
  }

  /** Creates a new project. */
  async create(data: CreateProject): Promise<Project> {
    const FUNCTION_NAME = 'create';
    try {
      return this.repo.insert(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create project', { cause: error });
    }
  }

  /** Updates a project by ID. */
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
   * Deletes a project and all its related records (tasks, workspaces, memories, phases, agent assignments).
   */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      this.repo.removeWithRelations(id);
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - deleted project ${id} and all related records`);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete project', { cause: error });
    }
  }

  /** Lists all projects with task count breakdown and agent count. */
  async listWithSummary(): Promise<ProjectSummary[]> {
    const FUNCTION_NAME = 'listWithSummary';
    try {
      const allProjects = this.repo.findAll();

      return allProjects.map((p) => {
        const counts = this.repo.countTasksByProject(p.id);
        const todo = counts['To Do'] ?? 0;
        const inProgress = counts['In Progress'] ?? 0;
        const inReview = counts['In Review'] ?? 0;
        const done = counts['Done'] ?? 0;
        return {
          ...p,
          taskCounts: { todo, inProgress, inReview, done, total: todo + inProgress + inReview + done },
          agentCount: this.repo.countAgentsByProject(p.id),
        };
      });
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list projects with summary', { cause: error });
    }
  }

  /** Bootstraps a new project with default agents, skills, and memory. */
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

  /** Exports project-specific Cursor rules. */
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
  async getContext(projectId: string): Promise<ProjectContext> {
    const FUNCTION_NAME = 'getContext';
    try {
      const project = await this.getById(projectId);
      const assignedAgents = this.repo.findAgentsByProjectId(projectId);
      const projectTasks = this.repo.findTasksByProjectId(projectId);
      const projectMemories = this.repo.findMemoriesByProjectId(projectId);

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

  /** Returns git branches for a project's local repository. */
  async getBranches(projectId: string): Promise<string[]> {
    const FUNCTION_NAME = 'getBranches';
    try {
      const project = await this.getById(projectId);
      if (!project.localPath) return [];
      const output = execSync('git branch -a --format="%(refname:short)"', {
        cwd: project.localPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      const branches = output
        .split('\n')
        .filter(Boolean)
        .map((b) => b.replace(/^origin\//, ''))
        .filter((b) => !b.startsWith('HEAD') && !b.startsWith('agents/'));
      return [...new Set(branches)];
    } catch {
      return [];
    }
  }

  /** Deep-scans the project directory, updates metadata, and regenerates the brief. */
  async scanAndUpdate(projectId: string): Promise<Project> {
    const FUNCTION_NAME = 'scanAndUpdate';
    try {
      const { deepScanProject } = await import('../../lib/filesystem-scanner/index.js');
      const project = await this.getById(projectId);
      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }
      const scanData = deepScanProject(project.localPath);
      const updates: Record<string, unknown> = { scanData };
      if (!project.techStack) {
        const techs = [
          ...(scanData.languages ?? []),
          ...(scanData.dependencies?.filter((d: string) =>
            ['react', 'vue', 'svelte', 'angular', 'next', 'nuxt', 'express', 'fastify', 'hono', 'nestjs',
             'drizzle-orm', 'prisma', 'tailwindcss', 'vite', 'electron'].includes(d)
          ) ?? []),
        ];
        if (techs.length) updates.techStack = techs.join(', ');
      }
      await this.update(projectId, updates);
      return await this.getById(projectId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to scan project', { cause: error });
    }
  }
}
