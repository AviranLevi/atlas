// NPM
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
// Utils
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

const FILE_PATH = 'services/worktree.service.ts';
const WORKSPACES_DIR = '.agent-workspaces';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export class WorktreeService {
  /**
   * Creates a git worktree for a task. Returns the absolute worktree path.
   */
  create(projectLocalPath: string, taskId: string, taskName: string): { worktreePath: string; branchName: string } {
    const FUNCTION_NAME = 'create';
    try {
      const shortId = taskId.slice(0, 8);
      const slug = slugify(taskName);
      const branchName = `agents/${shortId}/${slug}`;
      const worktreeDir = path.join(projectLocalPath, WORKSPACES_DIR);
      const worktreePath = path.join(worktreeDir, `${shortId}-${slug}`);

      fs.mkdirSync(worktreeDir, { recursive: true });

      execSync(`git worktree add -b "${branchName}" "${worktreePath}"`, {
        cwd: projectLocalPath,
        stdio: 'pipe',
      });

      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - created worktree at ${worktreePath}`);
      return { worktreePath, branchName };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create git worktree', { cause: error });
    }
  }

  /**
   * Removes a git worktree by path.
   */
  remove(worktreePath: string, projectLocalPath: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      execSync(`git worktree remove "${worktreePath}" --force`, {
        cwd: projectLocalPath,
        stdio: 'pipe',
      });
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - removed worktree at ${worktreePath}`);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to remove git worktree', { cause: error });
    }
  }

  /**
   * Lists all git worktrees for a project.
   */
  list(projectLocalPath: string): string[] {
    const FUNCTION_NAME = 'list';
    try {
      const output = execSync('git worktree list --porcelain', {
        cwd: projectLocalPath,
        encoding: 'utf-8',
      });
      return output
        .split('\n')
        .filter((line) => line.startsWith('worktree '))
        .map((line) => line.replace('worktree ', ''));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list git worktrees', { cause: error });
    }
  }

  /**
   * Prunes stale worktree references.
   */
  cleanup(projectLocalPath: string): void {
    const FUNCTION_NAME = 'cleanup';
    try {
      execSync('git worktree prune', {
        cwd: projectLocalPath,
        stdio: 'pipe',
      });
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - pruned stale worktrees`);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to cleanup git worktrees', { cause: error });
    }
  }
}
