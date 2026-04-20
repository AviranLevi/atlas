// External
import fs from 'node:fs';

// Shared
import type { WorktreeCommit } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../../db/repositories/index.js';

// Services
import { projectsService } from '../../index.js';
import { WorktreeService } from '../../worktree/index.js';

// Lib
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'services/orchestrator/git-history/git-history.service.ts';

/**
 * Exposes git-history operations scoped to a workspace — reading per-step
 * commits from the worktree branch, and reverting the branch to a previous
 * commit when the user wants to undo.
 *
 * Intentionally thin: most logic lives on WorktreeService; this layer handles
 * workspace-level concerns (stage gating, running-guard, base-branch resolution)
 * so the HTTP controller can stay boring.
 */
export class GitHistoryService {
  private worktreeService = new WorktreeService();

  /**
   * Returns commits on the workspace branch that are ahead of the base.
   *
   * Returns an empty list (not an error) for brainstorm/plan stages — those
   * workspaces don't use a worktree at all, so "no commits" is the correct
   * empty state rather than a 404.
   */
  async getWorkspaceCommits(workspaceId: string): Promise<WorktreeCommit[]> {
    const FUNCTION_NAME = 'getWorkspaceCommits';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      // Structured stages (brainstorm / plan) produce artifacts, not commits.
      if (workspace.workflowStage === 'brainstorm' || workspace.workflowStage === 'plan') {
        return [];
      }

      if (!workspace.worktreePath || !fs.existsSync(workspace.worktreePath)) {
        // Worktree was cleaned up (merged/deleted) — no history to show.
        return [];
      }

      // Prefer the branch persisted at spawn time so the diff base stays
      // stable even if the project's defaultBranch is later changed.
      // Fall back to auto-detect for older workspaces created before the
      // base_branch column existed.
      let baseRef = workspace.baseBranch ?? null;
      if (!baseRef) {
        try {
          const project = await projectsService.getById(workspace.projectId);
          if (project.localPath) {
            baseRef = this.worktreeService.getDefaultBranch(project.localPath);
          }
        } catch (err) {
          logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to resolve default branch`, err);
        }
      }
      if (!baseRef) {
        // Last-ditch fallback. listCommits handles unknown refs gracefully.
        baseRef = 'main';
      }

      return this.worktreeService.listCommits(workspace.worktreePath, baseRef);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to load workspace commits', { cause: error });
    }
  }

  /**
   * Resets the workspace branch to `commitSha`.
   *
   * Refuses to act on a running workspace — racing git commands with a live
   * agent process would produce undefined results (index corruption at worst,
   * silently clobbered work at best).
   */
  async revertWorkspaceToCommit(workspaceId: string, commitSha: string): Promise<void> {
    const FUNCTION_NAME = 'revertWorkspaceToCommit';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      if (workspace.status === 'running' || workspace.status === 'pending') {
        throw new AppError('Cannot revert a running workspace — stop the agent first', {
          status: 409,
        });
      }

      if (workspace.workflowStage === 'brainstorm' || workspace.workflowStage === 'plan') {
        throw new AppError('Revert is not available for brainstorm/plan workspaces', {
          status: 400,
        });
      }

      if (!workspace.worktreePath || !fs.existsSync(workspace.worktreePath)) {
        throw new AppError('Workspace worktree is gone — nothing to revert', { status: 410 });
      }

      this.worktreeService.revertToCommit(workspace.worktreePath, commitSha);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to revert workspace', { cause: error });
    }
  }
}

export const gitHistoryService = new GitHistoryService();
