// External
import { execFileSync, execSync } from 'node:child_process';
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
import { scanForSecrets } from '../../../lib/secrets-scanner.js';
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
  async mergeAndClose(workspaceId: string, skipSecretsScan = false): Promise<Workspace> {
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

      // Secrets scan: check diff for accidentally committed secrets before merge
      if (!skipSecretsScan) {
        const diff = this.worktreeService.getDiff(workspace.worktreePath, project.localPath);
        if (diff.files.length > 0) {
          const scan = scanForSecrets(diff.files);
          if (scan.hasSecrets) {
            throw new AppError('Potential secrets detected in diff', {
              status: 409,
              cause: { secretsDetected: true, findings: scan.findings },
            });
          }
        }
      }

      // Merge the branch — this is the irreversible action
      this.worktreeService.merge(workspace.worktreePath, project.localPath, workspace.branchName);

      // Mark as merged IMMEDIATELY after the irreversible merge so the
      // workspace never gets stuck at 'completed' if a cleanup step fails.
      const merged = workspacesRepository.update(workspaceId, {
        status: 'merged',
        completedAt: new Date().toISOString(),
      });

      // --- All steps below are best-effort cleanup. Each is individually
      //     wrapped so a failure in one doesn't block the others. ---

      let archivedLogPath: string | undefined;

      try {
        await tasksService.update(workspace.taskId, { status: TASK_STATUS.DONE });
      } catch (e) {
        logger.error(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to move task to Done`, e);
      }

      try {
        archivedLogPath = this.archiveLog(workspaceId, workspace);
      } catch (e) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to archive log`, e);
      }

      // Safety check: log if dirty after merge (shouldn't happen since we merge the branch)
      try {
        const dirty = this.worktreeService.checkDirty(workspace.worktreePath);
        if (dirty.isDirty) {
          logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree still dirty after merge (${dirty.fileCount} files)`);
        }
      } catch {
        // Non-critical — skip
      }

      // Clean up worktree + MCP config (keep log file + DB record for history)
      try {
        this.worktreeService.remove(workspace.worktreePath, project.localPath);
      } catch {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree already removed`);
      }

      try {
        removeMcpConfig(workspaceId, executorRegistry.getById(workspace.agentRuntime)?.mcpConfigFormat);
      } catch (e) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to remove MCP config`, e);
      }

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_completed',
        description: 'Changes merged and task completed',
        metadata: { branchName: workspace.branchName, archivedLogPath },
      });

      // Notify pipeline runner so it can advance to next task
      try {
        const { pipelinesService } = await import('../../index.js');
        pipelinesService
          .onWorkspaceTransition(workspaceId, 'approved', workspace.agentRuntime)
          .catch((e) => logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - pipeline transition failed`, e));
      } catch {
        // Not part of a pipeline — ignore
      }

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

      // Mark as merged IMMEDIATELY so the workspace never gets stuck at
      // 'completed' if a cleanup step below fails.
      const completed = workspacesRepository.update(workspaceId, {
        status: 'merged',
        completedAt: new Date().toISOString(),
      });

      // --- All steps below are best-effort cleanup ---

      let archivedLogPath: string | undefined;

      try {
        await tasksService.update(workspace.taskId, { status: TASK_STATUS.DONE });
      } catch (e) {
        logger.error(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to move task to Done`, e);
      }

      try {
        archivedLogPath = this.archiveLog(workspaceId, workspace);
      } catch (e) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to archive log`, e);
      }

      // Clean up worktree, branch, + MCP config (discard — no changes to keep)
      if (project.localPath) {
        try {
          this.worktreeService.remove(workspace.worktreePath, project.localPath);
        } catch {
          logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree already removed`);
        }
        // Delete the orphaned branch (no code to preserve)
        try {
          execFileSync('git', ['branch', '-D', workspace.branchName], {
            cwd: project.localPath,
            stdio: 'pipe',
          });
        } catch {
          // Branch already gone — that's fine
        }
      }

      try {
        removeMcpConfig(workspaceId, executorRegistry.getById(workspace.agentRuntime)?.mcpConfigFormat);
      } catch (e) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to remove MCP config`, e);
      }

      activityLogService.log({
        projectId: workspace.projectId,
        taskId: workspace.taskId,
        workspaceId,
        agentId: workspace.agentId,
        eventType: 'agent_completed',
        description: 'Task completed (no code changes)',
        metadata: { branchName: workspace.branchName, archivedLogPath },
      });

      // Notify pipeline runner so it can advance to next task
      try {
        const { pipelinesService } = await import('../../index.js');
        pipelinesService
          .onWorkspaceTransition(workspaceId, 'approved', workspace.agentRuntime)
          .catch((e) => logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - pipeline transition failed`, e));
      } catch {
        // Not part of a pipeline — ignore
      }

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
    opts: { title?: string; body?: string; skipSecretsScan?: boolean } = {},
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

      // Secrets scan: check diff for accidentally committed secrets before push
      if (!opts.skipSecretsScan) {
        const diff = this.worktreeService.getDiff(workspace.worktreePath, project.localPath);
        if (diff.files.length > 0) {
          const scan = scanForSecrets(diff.files);
          if (scan.hasSecrets) {
            throw new AppError('Potential secrets detected in diff', {
              status: 409,
              cause: { secretsDetected: true, findings: scan.findings },
            });
          }
        }
      }

      // Push the branch to remote
      const pushOpts = { stdio: 'pipe' as const, encoding: 'utf-8' as const };
      try {
        execFileSync('git', ['push', '-u', 'origin', workspace.branchName], {
          ...pushOpts,
          cwd: workspace.worktreePath,
        });
      } catch (_pushError: unknown) {
        // Try from project root if worktree is gone
        execFileSync('git', ['push', '-u', 'origin', workspace.branchName], {
          ...pushOpts,
          cwd: project.localPath,
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

      // Create PR using gh CLI (execFileSync avoids shell injection via title/body)
      const ghOutput = execFileSync(
        'gh',
        ['pr', 'create', '--title', prTitle, '--body', prBody, '--base', baseBranch, '--head', workspace.branchName],
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
