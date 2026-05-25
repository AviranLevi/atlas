// External
import { execFileSync, execSync } from 'node:child_process';

// Shared
import type { CreateProject, GitPullResult, GitStatus, Project, UpdateProject } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { projectsRepository } from '../../db/repositories/index.js';

// Lib
import type { ProjectContext, ProjectSummary } from './projects.types.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

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
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to list projects', { cause: error });
    }
  }

  /** Returns a project by ID. */
  async getById(id: string): Promise<Project> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
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
      if (error instanceof AppError) throw error;
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
      if (error instanceof AppError) throw error;
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
      if (error instanceof AppError) throw error;
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
        const todo = counts[TASK_STATUS.TODO] ?? 0;
        const inProgress = counts[TASK_STATUS.IN_PROGRESS] ?? 0;
        const inReview = counts[TASK_STATUS.IN_REVIEW] ?? 0;
        const done = counts[TASK_STATUS.DONE] ?? 0;
        return {
          ...p,
          taskCounts: { todo, inProgress, inReview, done, total: todo + inProgress + inReview + done },
          agentCount: this.repo.countAgentsByProject(p.id),
        };
      });
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to list projects with summary', { cause: error });
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
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get project context', { cause: error });
    }
  }

  /** Returns git branches for a project's local repository. */
  async getBranches(projectId: string): Promise<string[]> {
    const _FUNCTION_NAME = 'getBranches';
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

  /** Creates a new git branch in the project's local repository without checking it out. */
  async createBranch(projectId: string, branchName: string, baseBranch?: string): Promise<string> {
    const FUNCTION_NAME = 'createBranch';
    try {
      const project = await this.getById(projectId);
      if (!project.localPath) {
        throw new AppError('Project has no local path configured', { status: 400 });
      }

      const sanitized = branchName.replace(/[^a-zA-Z0-9._\-/]/g, '-');
      if (!sanitized || sanitized === '-') {
        throw new AppError('Invalid branch name', { status: 400 });
      }

      const args = ['branch', sanitized];
      if (baseBranch) {
        const sanitizedBase = baseBranch.replace(/[^a-zA-Z0-9._\-/]/g, '-');
        if (sanitizedBase && sanitizedBase !== '-') args.push(sanitizedBase);
      }

      execFileSync('git', args, {
        cwd: project.localPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - created branch "${sanitized}" in ${project.localPath}`);
      return sanitized;
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (msg.includes('already exists')) {
        throw new AppError(`Branch "${branchName}" already exists`, { status: 409 });
      }
      throw new AppError(`Failed to create branch: ${msg}`, { status: 500, cause: error });
    }
  }

  /** Checks out an existing branch in the project's local repository. */
  async checkoutBranch(projectId: string, branchName: string): Promise<string> {
    const FUNCTION_NAME = 'checkoutBranch';
    try {
      const project = await this.getById(projectId);
      if (!project.localPath) {
        throw new AppError('Project has no local path configured', { status: 400 });
      }

      const opts = {
        cwd: project.localPath,
        encoding: 'utf-8' as const,
        stdio: ['pipe', 'pipe', 'pipe'] as ['pipe', 'pipe', 'pipe'],
        timeout: 15_000,
      };

      // Safety: refuse checkout if there are uncommitted changes
      const status = execSync('git status --porcelain', opts).trim();
      if (status) {
        throw new AppError('Cannot switch branches — there are uncommitted changes. Commit or stash them first.', {
          status: 409,
        });
      }

      execFileSync('git', ['checkout', branchName], opts);
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - checked out "${branchName}" in ${project.localPath}`);
      return branchName;
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (msg.includes('did not match any')) {
        throw new AppError(`Branch "${branchName}" does not exist`, { status: 404 });
      }
      throw new AppError(`Failed to checkout branch: ${msg}`, { status: 500, cause: error });
    }
  }

  /** Pulls the latest changes from origin into the project's local repository. */
  async gitPull(projectId: string): Promise<GitPullResult> {
    const FUNCTION_NAME = 'gitPull';
    try {
      const project = await this.getById(projectId);
      if (!project.localPath) {
        throw new AppError('Project has no local path configured', { status: 400 });
      }
      const branch = project.defaultBranch ?? 'main';
      const opts = {
        cwd: project.localPath,
        encoding: 'utf-8' as const,
        stdio: ['pipe', 'pipe', 'pipe'] as ['pipe', 'pipe', 'pipe'],
        timeout: 30_000,
      };
      let output: string;
      try {
        output = execFileSync('git', ['pull', 'origin', branch], opts).trim();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes('conflict')) {
          return { status: 'conflict', message: 'Merge conflict — resolve manually.' };
        }
        throw err;
      }
      const upToDate = output.toLowerCase().includes('already up to date');
      return {
        status: upToDate ? 'up-to-date' : 'ok',
        message: output.split('\n')[0] ?? output,
      };
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to pull from remote', { cause: error });
    }
  }

  /**
   * Fetches remote ref updates and returns how many commits the local HEAD is behind
   * origin's default branch. Safe to poll — fetch only downloads metadata, not objects,
   * when the remote is up to date.
   */
  async getGitStatus(projectId: string): Promise<GitStatus> {
    const FUNCTION_NAME = 'getGitStatus';
    const now = new Date().toISOString();
    try {
      const project = await this.getById(projectId);
      if (!project.localPath) {
        return { currentBranch: null, commitsBehind: 0, lastChecked: now };
      }
      const branch = project.defaultBranch ?? 'main';
      const opts = {
        cwd: project.localPath,
        encoding: 'utf-8' as const,
        stdio: ['pipe', 'pipe', 'pipe'] as ['pipe', 'pipe', 'pipe'],
        timeout: 15_000,
      };

      // Detect which branch is currently checked out
      let currentBranch: string | null = null;
      try {
        currentBranch = execSync('git rev-parse --abbrev-ref HEAD', opts).trim() || null;
      } catch {
        // Detached HEAD or not a git repo — leave null
      }

      try {
        execSync('git fetch origin', opts);
      } catch {
        // Network unavailable or no remote — return what we have
        return { currentBranch, commitsBehind: 0, lastChecked: now };
      }
      const countStr = execFileSync('git', ['rev-list', `HEAD..origin/${branch}`, '--count'], opts).trim();
      const commitsBehind = parseInt(countStr, 10) || 0;
      return { currentBranch, commitsBehind, lastChecked: new Date().toISOString() };
    } catch (error: unknown) {
      // Non-fatal — polling must not break the UI
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      return { currentBranch: null, commitsBehind: 0, lastChecked: now };
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
            [
              'react',
              'vue',
              'svelte',
              'angular',
              'next',
              'nuxt',
              'express',
              'fastify',
              'hono',
              'nestjs',
              'drizzle-orm',
              'prisma',
              'tailwindcss',
              'vite',
              'electron',
            ].includes(d),
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
