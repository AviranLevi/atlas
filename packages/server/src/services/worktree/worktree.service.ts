// External
import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { minimatch } from 'minimatch';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

// Local
import { WORKSPACES_DIR, DIFF_EXCLUDE_PATTERNS, DIFF_MAX_BUFFER, PER_FILE_LINE_CAP } from './worktree.constants.js';
import { getDefaultBranch } from './worktree-branch.helpers.js';
import { parseDiffPatches, slugify } from './worktree-diff.helpers.js';
import {
  ensureChangesCommitted as ensureChangesCommittedHelper,
  listCommits as listCommitsHelper,
} from './worktree-commits.helpers.js';
import type {
  DiffFile,
  WorktreeDiffResult,
  WorktreeCreateResult,
  WorktreeCommit,
  EnsureChangesCommittedContext,
} from './worktree.types.js';

const FILE_PATH = 'services/worktree/worktree.service.ts';

export class WorktreeService {
  /** Creates a git worktree for a task. */
  create(projectLocalPath: string, taskId: string, taskName: string, baseBranch?: string): WorktreeCreateResult {
    const FUNCTION_NAME = 'create';
    try {
      const shortId = taskId.slice(0, 8);
      const slug = slugify(taskName);
      const branchName = `agents/${shortId}/${slug}`;
      const worktreeDir = path.join(projectLocalPath, WORKSPACES_DIR);
      const worktreePath = path.join(worktreeDir, `${shortId}-${slug}`);

      fs.mkdirSync(worktreeDir, { recursive: true });

      // Clean up stale worktree/branch from a previous run of the same task
      if (fs.existsSync(worktreePath)) {
        try {
          execSync(`git worktree remove "${worktreePath}" --force`, {
            cwd: projectLocalPath,
            stdio: 'pipe',
          });
        } catch {
          fs.rmSync(worktreePath, { recursive: true, force: true });
        }
      }

      execSync('git worktree prune', { cwd: projectLocalPath, stdio: 'pipe' });

      try {
        execSync(`git branch -D "${branchName}"`, {
          cwd: projectLocalPath,
          stdio: 'pipe',
        });
      } catch {
        // Branch doesn't exist — that's fine
      }

      const base = baseBranch || this.getDefaultBranch(projectLocalPath);

      execSync(`git worktree add -b "${branchName}" "${worktreePath}" "${base}"`, {
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

  /** Checks whether a worktree has uncommitted changes. */
  checkDirty(worktreePath: string): { isDirty: boolean; fileCount: number } {
    const FUNCTION_NAME = 'checkDirty';
    try {
      if (!fs.existsSync(worktreePath)) {
        return { isDirty: false, fileCount: 0 };
      }
      const status = execSync('git status --porcelain', {
        cwd: worktreePath,
        encoding: 'utf-8',
      }).trim();
      if (!status) return { isDirty: false, fileCount: 0 };
      const fileCount = status.split('\n').filter(Boolean).length;
      return { isDirty: true, fileCount };
    } catch (error: unknown) {
      // On error (e.g. worktree corrupted), treat as not dirty to avoid blocking cleanup
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      return { isDirty: false, fileCount: 0 };
    }
  }

  /** Removes a git worktree by path. */
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

  /** Lists all git worktrees for a project. */
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
   * Returns the git diff for a worktree branch vs its base (main/master).
   *
   * Three-pass approach:
   *  1. `--name-only -z` to get a NUL-separated file list (safe for any filename).
   *  2. JS `minimatch` filter (authoritative — git pathspec excluded entirely
   *     because `**` prefix in negative pathspecs silently fails on top-level dirs).
   *  3. `--numstat` + full diff with filtered files as positional args after `--`.
   *     Uses `execFileSync` (no shell) so filenames are safe without quoting.
   *
   * Files exceeding PER_FILE_LINE_CAP are returned with `truncated: true` and
   * no patch, so the UI can render a placeholder instead of OOMing the buffer.
   */
  getDiff(worktreePath: string, projectLocalPath: string, branchRef = 'HEAD'): WorktreeDiffResult {
    const FUNCTION_NAME = 'getDiff';
    const emptyResult: WorktreeDiffResult = {
      files: [],
      summary: { additions: 0, deletions: 0, filesChanged: 0 },
    };
    try {
      const baseBranch = this.getDefaultBranch(projectLocalPath);
      const diffRef = `${baseBranch}...${branchRef}`;

      const nameRaw = execFileSync('git', ['diff', diffRef, '--name-only', '-z'], {
        cwd: worktreePath,
        encoding: 'utf-8',
        maxBuffer: 1 * 1024 * 1024,
      });
      const allFiles = nameRaw.split('\0').filter(Boolean);
      if (allFiles.length === 0) return emptyResult;

      const keep = allFiles.filter((f) => !DIFF_EXCLUDE_PATTERNS.some((p) => minimatch(f, p, { dot: true })));
      if (keep.length === 0) return emptyResult;

      const numstatRaw = execFileSync('git', ['diff', diffRef, '--numstat', '--', ...keep], {
        cwd: worktreePath,
        encoding: 'utf-8',
        maxBuffer: 1 * 1024 * 1024,
      }).trim();

      const files: DiffFile[] = [];
      const diffKeep: string[] = [];
      let totalAdditions = 0;
      let totalDeletions = 0;

      if (numstatRaw) {
        for (const line of numstatRaw.split('\n')) {
          if (!line) continue;
          const [add, del, filename] = line.split('\t');
          const additions = add === '-' ? 0 : parseInt(add, 10);
          const deletions = del === '-' ? 0 : parseInt(del, 10);
          totalAdditions += additions;
          totalDeletions += deletions;

          if (additions + deletions > PER_FILE_LINE_CAP) {
            files.push({ filename, additions, deletions, truncated: true });
          } else {
            files.push({ filename, additions, deletions });
            diffKeep.push(filename);
          }
        }
      }

      if (diffKeep.length > 0) {
        const diffOutput = execFileSync('git', ['diff', diffRef, '--', ...diffKeep], {
          cwd: worktreePath,
          encoding: 'utf-8',
          maxBuffer: DIFF_MAX_BUFFER,
        }).trim();

        const filePatchMap = parseDiffPatches(diffOutput);
        for (const file of files) {
          if (!file.truncated) {
            file.patch = filePatchMap.get(file.filename);
          }
        }
      }

      return {
        files,
        summary: { additions: totalAdditions, deletions: totalDeletions, filesChanged: files.length },
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, { err: error, worktreePath });
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

  /** Merges a worktree branch back into the base branch (main/master). */
  merge(_worktreePath: string, projectLocalPath: string, branchName: string): void {
    const FUNCTION_NAME = 'merge';
    try {
      const baseBranch = this.getDefaultBranch(projectLocalPath);

      execSync(`git merge "${branchName}" --no-ff -m "Merge agent branch: ${branchName}"`, {
        cwd: projectLocalPath,
        stdio: 'pipe',
      });

      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - merged ${branchName} into ${baseBranch}`);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to merge branch', { cause: error });
    }
  }

  /**
   * Safety net: commits any uncommitted changes left behind by the agent.
   * Returns true if a commit was created, false if the tree was already clean.
   */
  ensureChangesCommitted(worktreePath: string, context?: EnsureChangesCommittedContext): boolean {
    return ensureChangesCommittedHelper(worktreePath, context);
  }

  /**
   * Lists commits on the worktree branch that are ahead of `baseRef`,
   * newest-first, enriched with numstat totals.
   */
  listCommits(worktreePath: string, baseRef: string): WorktreeCommit[] {
    return listCommitsHelper(worktreePath, baseRef);
  }

  /**
   * Lists commits on `branchName` ahead of `baseRef`, read from the main repo
   * at `projectPath`. Used as a fallback when the worktree directory is gone
   * but the branch still exists in the project's git history.
   */
  listCommitsOnBranch(projectPath: string, branchName: string, baseRef: string): WorktreeCommit[] {
    return listCommitsHelper(projectPath, baseRef, branchName);
  }

  /**
   * Hard-resets the worktree branch to `sha`.
   *
   * Safety guards:
   *   1. Rejects unknown SHAs (git rev-parse fails).
   *   2. Rejects commits that are NOT ancestors of HEAD — we only allow
   *      "undo forward" on this branch.
   *   3. Caller (git-history.service) rejects reverts on running workspaces.
   *
   * Uses `reset --hard` — uncommitted changes in the worktree are discarded.
   */
  revertToCommit(worktreePath: string, sha: string): void {
    const FUNCTION_NAME = 'revertToCommit';
    try {
      if (!fs.existsSync(worktreePath)) {
        throw new AppError('Worktree path does not exist', { status: 400 });
      }
      if (!/^[0-9a-f]{4,64}$/i.test(sha)) {
        throw new AppError('Invalid commit SHA', { status: 400 });
      }

      let resolvedSha: string;
      try {
        resolvedSha = execSync(`git rev-parse --verify "${sha}^{commit}"`, {
          cwd: worktreePath,
          encoding: 'utf-8',
        }).trim();
      } catch {
        throw new AppError('Commit not found in this worktree', { status: 404 });
      }

      try {
        execSync(`git merge-base --is-ancestor ${resolvedSha} HEAD`, {
          cwd: worktreePath,
          stdio: 'pipe',
        });
      } catch {
        throw new AppError('Commit is not an ancestor of HEAD; cannot revert', {
          status: 400,
        });
      }

      execSync(`git reset --hard ${resolvedSha}`, {
        cwd: worktreePath,
        stdio: 'pipe',
      });

      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - reset worktree at ${worktreePath} to ${resolvedSha}`);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to revert worktree', { cause: error });
    }
  }

  /** Prunes stale worktree references. */
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

  /** Detects the default branch (main/master) for a project. */
  getDefaultBranch(projectLocalPath: string): string {
    return getDefaultBranch(projectLocalPath);
  }
}
