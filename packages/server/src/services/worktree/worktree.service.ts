// External
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

// Local
import { WORKSPACES_DIR, DIFF_EXCLUDE_PATTERNS, DIFF_MAX_BUFFER } from './worktree.constants.js';
import type { DiffFile, WorktreeDiffResult, WorktreeCreateResult } from './worktree.types.js';

const FILE_PATH = 'services/worktree/worktree.service.ts';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

export class WorktreeService {
  /** Creates a git worktree for a task. */
  create(
    projectLocalPath: string,
    taskId: string,
    taskName: string,
    baseBranch?: string,
  ): WorktreeCreateResult {
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

  /** Returns the git diff for a worktree branch vs its base (main/master). */
  getDiff(worktreePath: string, projectLocalPath: string): WorktreeDiffResult {
    const FUNCTION_NAME = 'getDiff';
    try {
      const baseBranch = this.getDefaultBranch(projectLocalPath);
      const exclude = DIFF_EXCLUDE_PATTERNS.map((p) => `':!${p}'`).join(' ');

      const diffStat = execSync(`git diff ${baseBranch}...HEAD --numstat -- . ${exclude}`, {
        cwd: worktreePath,
        encoding: 'utf-8',
        maxBuffer: DIFF_MAX_BUFFER,
      }).trim();

      const diffOutput = execSync(`git diff ${baseBranch}...HEAD -- . ${exclude}`, {
        cwd: worktreePath,
        encoding: 'utf-8',
        maxBuffer: DIFF_MAX_BUFFER,
      }).trim();

      const files: DiffFile[] = [];
      let totalAdditions = 0;
      let totalDeletions = 0;

      if (diffStat) {
        for (const line of diffStat.split('\n')) {
          const [add, del, file] = line.split('\t');
          const additions = add === '-' ? 0 : parseInt(add, 10);
          const deletions = del === '-' ? 0 : parseInt(del, 10);
          totalAdditions += additions;
          totalDeletions += deletions;
          files.push({ filename: file, additions, deletions });
        }
      }

      const filePatchMap = this.parseDiffPatches(diffOutput);
      for (const file of files) {
        file.patch = filePatchMap.get(file.filename);
      }

      return {
        files,
        summary: { additions: totalAdditions, deletions: totalDeletions, filesChanged: files.length },
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
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
  ensureChangesCommitted(worktreePath: string): boolean {
    const FUNCTION_NAME = 'ensureChangesCommitted';
    try {
      if (!fs.existsSync(worktreePath)) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - worktree path does not exist: ${worktreePath}`);
        return false;
      }

      const status = execSync('git status --porcelain', {
        cwd: worktreePath,
        encoding: 'utf-8',
      }).trim();

      if (!status) {
        return false;
      }

      logger.warn(
        `${FILE_PATH} :: ${FUNCTION_NAME} - agent left uncommitted changes (${status.split('\n').length} files), auto-committing`,
      );

      execSync('git add -A', { cwd: worktreePath, stdio: 'pipe' });
      execSync('git commit -m "chore: auto-commit uncommitted agent changes"', {
        cwd: worktreePath,
        stdio: 'pipe',
      });

      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - auto-committed changes in ${worktreePath}`);
      return true;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to auto-commit`, error);
      return false;
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
    try {
      const head = execSync('git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || echo ""', {
        cwd: projectLocalPath,
        encoding: 'utf-8',
      }).trim();
      if (head) {
        return head.replace('refs/remotes/origin/', '');
      }
    } catch {
      // Fall through
    }

    try {
      execSync('git rev-parse --verify main', { cwd: projectLocalPath, stdio: 'pipe' });
      return 'main';
    } catch {
      return 'master';
    }
  }

  private parseDiffPatches(diffOutput: string): Map<string, string> {
    const patches = new Map<string, string>();
    if (!diffOutput) return patches;

    const fileSections = diffOutput.split(/^diff --git /m).slice(1);
    for (const section of fileSections) {
      const headerMatch = section.match(/^a\/(.+?) b\//);
      if (headerMatch) {
        patches.set(headerMatch[1], `diff --git ${section}`);
      }
    }
    return patches;
  }
}
