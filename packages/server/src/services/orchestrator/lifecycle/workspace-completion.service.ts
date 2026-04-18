// External
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Shared
import type { Workspace } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../../db/repositories/index.js';

// Services
import { activityLogService, projectsService, tasksService } from '../../index.js';
import { TASK_STATUS } from '@atlas/shared';

// Executors
import { executorRegistry, removeMcpConfig } from '../../../executors/index.js';

// Lib
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';
import { WorktreeService } from '../../worktree/index.js';

const FILE_PATH = 'services/orchestrator/workspace-completion.service.ts';
const OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'workspace-logs');
const ARCHIVE_DIR = path.resolve(process.cwd(), 'data', 'archived-logs');

export class WorkspaceCompletionService {
  private worktreeService = new WorktreeService();

  /**
   * Archives a workspace log to the archived-logs directory.
   * Returns the archived file path, or undefined if no log exists.
   */
  private archiveLog(workspaceId: string, workspace: Workspace): string | undefined {
    const logFile = path.join(OUTPUT_DIR, `${workspaceId}.log`);
    if (!fs.existsSync(logFile)) return undefined;

    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    }

    // Name: taskName_branchName_timestamp.log (sanitized)
    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
    const taskName = sanitize(workspace.taskName ?? 'unknown');
    const branch = sanitize(workspace.branchName ?? workspaceId);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveName = `${taskName}_${branch}_${timestamp}.log`;
    const archivePath = path.join(ARCHIVE_DIR, archiveName);

    fs.copyFileSync(logFile, archivePath);
    logger.info(`${FILE_PATH} :: archiveLog - Archived workspace log to ${archiveName}`);
    return archivePath;
  }

  /** Merges the worktree branch, moves task to Done, and archives logs. */
  async mergeAndClose(workspaceId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'mergeAndClose';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('Can only merge completed workspaces', { status: 400 });
      }

      const project = await projectsService.getById(workspace.projectId);

      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      // Merge the branch
      this.worktreeService.merge(workspace.worktreePath, project.localPath, workspace.branchName);

      // Move task to Done
      await tasksService.update(workspace.taskId, { status: TASK_STATUS.DONE });

      // Archive the workspace log (backup copy with descriptive name)
      const archivedLogPath = this.archiveLog(workspaceId, workspace);

      // Clean up worktree + MCP config (keep log file + DB record for history)
      try {
        this.worktreeService.remove(workspace.worktreePath, project.localPath);
      } catch {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree already removed`);
      }

      removeMcpConfig(workspaceId, executorRegistry.getById(workspace.agentRuntime)?.mcpConfigFormat);

      // Mark as merged (keep the DB record for history)
      const merged = workspacesRepository.update(workspaceId, {
        status: 'merged',
        completedAt: new Date().toISOString(),
      });

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_completed',
        description: 'Changes merged and task completed',
        metadata: { branchName: workspace.branchName, archivedLogPath },
      });

      return merged;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to merge and close', { cause: error });
    }
  }

  /**
   * Completes a workspace without merging code changes.
   * Used for non-code tasks (research, review, memory creation, etc.)
   */
  async completeWithoutMerge(workspaceId: string): Promise<Workspace> {
    const FUNCTION_NAME = 'completeWithoutMerge';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('Can only complete a finished workspace', { status: 400 });
      }

      const project = await projectsService.getById(workspace.projectId);

      // Move task to Done
      await tasksService.update(workspace.taskId, { status: TASK_STATUS.DONE });

      // Archive the workspace log
      const archivedLogPath = this.archiveLog(workspaceId, workspace);

      // Clean up worktree, branch, + MCP config (discard — no changes to keep)
      if (project.localPath) {
        try {
          this.worktreeService.remove(workspace.worktreePath, project.localPath);
        } catch {
          logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree already removed`);
        }
        // Delete the orphaned branch (no code to preserve)
        try {
          execSync(`git branch -D "${workspace.branchName}"`, {
            cwd: project.localPath,
            stdio: 'pipe',
          });
        } catch {
          // Branch already gone — that's fine
        }
      }

      removeMcpConfig(workspaceId, executorRegistry.getById(workspace.agentRuntime)?.mcpConfigFormat);

      // Mark as merged (same final status for history consistency)
      const completed = workspacesRepository.update(workspaceId, {
        status: 'merged',
        completedAt: new Date().toISOString(),
      });

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_completed',
        description: 'Task completed (no code changes)',
        metadata: { branchName: workspace.branchName, archivedLogPath },
      });

      return completed;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to complete workspace', { cause: error });
    }
  }

  /** Pushes the branch and creates a GitHub pull request via gh CLI. */
  async createPullRequest(
    workspaceId: string,
    opts: { title?: string; body?: string } = {},
  ): Promise<{ prUrl: string; prNumber: number }> {
    const FUNCTION_NAME = 'createPullRequest';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status !== 'completed') {
        throw new AppError('Can only create PR for completed workspaces', { status: 400 });
      }

      const project = await projectsService.getById(workspace.projectId);

      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      if (!project.repositoryUrl?.includes('github.com')) {
        throw new AppError('Project has no GitHub repository configured', { status: 400 });
      }

      // Push the branch to remote
      try {
        execSync(`git push -u origin "${workspace.branchName}"`, {
          cwd: workspace.worktreePath,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
      } catch (_pushError: unknown) {
        // Try from project root if worktree is gone
        execSync(`git push -u origin "${workspace.branchName}"`, {
          cwd: project.localPath,
          stdio: 'pipe',
          encoding: 'utf-8',
        });
      }

      const task = await tasksService.getById(workspace.taskId);
      const prTitle = opts.title || task.name;
      const prBody =
        opts.body ||
        [
          '## Summary',
          '',
          task.notes || `Automated changes for: ${task.name}`,
          '',
          '---',
          `*Created via [atlas](${project.repositoryUrl}) workspace*`,
        ].join('\n');

      const baseBranch = project.defaultBranch || 'main';

      // Create PR using gh CLI
      const ghOutput = execSync(
        `gh pr create --title "${prTitle.replace(/"/g, '\\"')}" --body "${prBody.replace(/"/g, '\\"')}" --base "${baseBranch}" --head "${workspace.branchName}"`,
        {
          cwd: project.localPath,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      ).trim();

      // gh pr create returns the PR URL
      const prUrl = ghOutput;
      const prNumberMatch = prUrl.match(/\/pull\/(\d+)/);
      const prNumber = prNumberMatch ? parseInt(prNumberMatch[1], 10) : 0;

      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - Created PR #${prNumber}: ${prUrl}`);

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_completed',
        description: `Pull request created: #${prNumber}`,
        metadata: { prUrl, prNumber },
      });

      return { prUrl, prNumber };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      throw new AppError(`Failed to create pull request: ${msg}`, { cause: error });
    }
  }
}

export const workspaceCompletionService = new WorkspaceCompletionService();
