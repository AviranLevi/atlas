// External
import fs from 'node:fs';

// Repositories
import { workspacesRepository } from '../../../db/repositories/index.js';

// Services
import { projectsService } from '../../index.js';

// Lib
import type { DiffResult } from '../shared/orchestrator.types.js';
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';
import { WorktreeService } from '../../worktree/index.js';

const FILE_PATH = 'services/orchestrator/review/diff.service.ts';

export class DiffService {
  private worktreeService = new WorktreeService();

  /** Returns the git diff for a workspace (empty if worktree is gone). */
  async getDiff(workspaceId: string): Promise<DiffResult> {
    const FUNCTION_NAME = 'getDiff';
    try {
      const workspace = workspacesRepository.findByIdOrThrow(workspaceId);

      // For merged/stopped workspaces the worktree has been removed — return empty diff
      if (workspace.status === 'merged' || workspace.status === 'stopped') {
        return {
          files: [],
          summary: { additions: 0, deletions: 0, filesChanged: 0 },
        };
      }

      const project = await projectsService.getById(workspace.projectId);

      if (!project.localPath) {
        throw new AppError('Project has no local path', { status: 400 });
      }

      // Worktree directory exists — fast path.
      if (fs.existsSync(workspace.worktreePath)) {
        return this.worktreeService.getDiff(workspace.worktreePath, project.localPath);
      }

      // Worktree directory is gone but branch still lives in the main repo —
      // compute diff from there so the review page stays populated after navigation.
      if (workspace.branchName) {
        logger.info(
          `${FILE_PATH} :: ${FUNCTION_NAME} - worktree dir gone, diffing branch ${workspace.branchName} from main repo`,
        );
        return this.worktreeService.getDiff(project.localPath, project.localPath, workspace.branchName);
      }

      logger.warn(
        `${FILE_PATH} :: ${FUNCTION_NAME} - worktree path no longer exists and no branch stored: ${workspace.worktreePath}`,
      );
      return {
        files: [],
        summary: { additions: 0, deletions: 0, filesChanged: 0 },
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, { err: error, workspaceId });
      if (error instanceof AppError) throw error;
      const isBufferOverflow =
        error instanceof Error &&
        (error.message.includes('maxBuffer') || (error as NodeJS.ErrnoException).code === 'ENOBUFS');
      if (isBufferOverflow) {
        throw new AppError('Diff too large to render', { status: 413 });
      }
      throw new AppError('Failed to get diff', { cause: error });
    }
  }
}

export const diffService = new DiffService();
