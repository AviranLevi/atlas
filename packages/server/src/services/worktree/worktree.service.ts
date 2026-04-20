// External
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

// Local
import { WORKSPACES_DIR, DIFF_EXCLUDE_PATTERNS, DIFF_MAX_BUFFER } from './worktree.constants.js';
import type {
  DiffFile,
  WorktreeDiffResult,
  WorktreeCreateResult,
  WorktreeCommit,
  EnsureChangesCommittedContext,
} from './worktree.types.js';

// Identity used for any commit Atlas creates on behalf of an agent.
// Agent step commits MUST also use these flags (enforced via prompt).
// Applied via -c flags so the user's global git config is never mutated.
const ATLAS_GIT_IDENTITY = '-c user.name="Atlas Agent" -c user.email="atlas@local"';

// A commit subject shaped like `step 3/7: add revert endpoint`. Captures:
//   1 = step index, 2 = step total, 3 = title.
// Tolerant of extra whitespace but requires both numbers and the colon.
const STEP_COMMIT_REGEX = /^step\s+(\d+)\s*\/\s*(\d+)\s*:\s*(.+)$/i;

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
   *
   * For execute-stage workspaces, uses a deliberately loud commit subject
   * (`execute: <task> (steps not tracked)`) so that a silent prompt-compliance
   * regression — an agent ignoring the "step N/M" protocol — shows up as a
   * visible anomaly in the Commits panel rather than being masked by a generic
   * "chore: auto-commit" entry. For all other stages, keeps the neutral
   * chore message.
   *
   * Returns true if a commit was created, false if the tree was already clean.
   */
  ensureChangesCommitted(worktreePath: string, context?: EnsureChangesCommittedContext): boolean {
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

      const fileCount = status.split('\n').length;
      logger.warn(
        `${FILE_PATH} :: ${FUNCTION_NAME} - agent left uncommitted changes (${fileCount} files), auto-committing`,
      );

      const message =
        context?.stage === 'execute'
          ? `execute: ${context.taskName ?? 'task'} (steps not tracked)`
          : 'chore: auto-commit uncommitted agent changes';

      execSync('git add -A', { cwd: worktreePath, stdio: 'pipe' });
      // shellEscape: message goes through a string-interpolated execSync, so
      // double-quotes in the task name would break the commit. Strip them.
      const safeMessage = message.replace(/"/g, "'");
      execSync(`git ${ATLAS_GIT_IDENTITY} commit -m "${safeMessage}"`, {
        cwd: worktreePath,
        stdio: 'pipe',
      });

      logger.info(
        `${FILE_PATH} :: ${FUNCTION_NAME} - auto-committed changes in ${worktreePath} (stage=${context?.stage ?? 'none'})`,
      );
      return true;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to auto-commit`, error);
      return false;
    }
  }

  /**
   * Lists commits on the worktree branch that are ahead of `baseRef`.
   * Returns newest-first; each row is enriched with numstat totals so the
   * UI can render "+X / -Y" without a second round-trip.
   *
   * Uses a NUL-separated record format (-z) so commit messages containing
   * newlines or tabs can't corrupt parsing.
   */
  listCommits(worktreePath: string, baseRef: string): WorktreeCommit[] {
    const FUNCTION_NAME = 'listCommits';
    try {
      if (!fs.existsSync(worktreePath)) {
        return [];
      }

      // Format fields: sha|shortSha|authorName|authorDate|subject
      // Separator chosen to be extremely unlikely in commit metadata.
      // %x00 terminates the record (matches -z), and the numstat block for
      // each commit follows the subject until the next NUL.
      const FIELD_SEP = '\u001f';
      const format = ['%H', '%h', '%an', '%aI', '%s'].join(FIELD_SEP);

      let raw: string;
      try {
        raw = execSync(`git log ${baseRef}..HEAD --format="${format}%x00" --numstat`, {
          cwd: worktreePath,
          encoding: 'utf-8',
          maxBuffer: DIFF_MAX_BUFFER,
        });
      } catch (err) {
        // baseRef may not exist inside the worktree (shallow clones, missing
        // upstream). Fall back to HEAD's entire history as a best-effort.
        logger.warn(
          `${FILE_PATH} :: ${FUNCTION_NAME} - ${baseRef}..HEAD failed, falling back to full HEAD history`,
          err,
        );
        raw = execSync(`git log HEAD --format="${format}%x00" --numstat`, {
          cwd: worktreePath,
          encoding: 'utf-8',
          maxBuffer: DIFF_MAX_BUFFER,
        });
      }

      const commits: WorktreeCommit[] = [];
      const records = raw
        .split('\u0000')
        .map((r) => r.trim())
        .filter(Boolean);

      for (const record of records) {
        // The record starts with the formatted header line, followed by
        // optional numstat lines (one per file changed, tab-separated).
        const lines = record.split('\n');
        const header = lines[0];
        if (!header) continue;
        const [sha, shortSha, author, timestamp, ...subjectParts] = header.split(FIELD_SEP);
        if (!sha || !shortSha) continue;
        const message = subjectParts.join(FIELD_SEP);

        let insertions = 0;
        let deletions = 0;
        let filesChanged = 0;
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const [add, del] = line.split('\t');
          // Binary files show '-' — count the file but not the lines.
          const adds = add === '-' ? 0 : parseInt(add, 10) || 0;
          const dels = del === '-' ? 0 : parseInt(del, 10) || 0;
          insertions += adds;
          deletions += dels;
          filesChanged += 1;
        }

        const match = message.match(STEP_COMMIT_REGEX);
        const stepIndex = match ? parseInt(match[1], 10) : null;
        const stepTotal = match ? parseInt(match[2], 10) : null;

        commits.push({
          sha,
          shortSha,
          message,
          author: author ?? '',
          timestamp: timestamp ?? '',
          stepIndex,
          stepTotal,
          filesChanged,
          insertions,
          deletions,
        });
      }

      return commits;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list commits', { cause: error });
    }
  }

  /**
   * Hard-resets the worktree branch to `sha`.
   *
   * Safety guards:
   *   1. Rejects unknown SHAs (git rev-parse fails).
   *   2. Rejects commits that are NOT ancestors of HEAD — we only allow
   *      "undo forward" on this branch. Users who want to cherry-pick from
   *      elsewhere should do it manually.
   *   3. Caller (git-history.service) rejects reverts on running workspaces.
   *
   * Uses `reset --hard` — uncommitted changes in the worktree are discarded.
   * For execute-stage workspaces that's acceptable because the agent is
   * always expected to commit before yielding control.
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

      // Resolve short SHAs + verify the object exists at all.
      let resolvedSha: string;
      try {
        resolvedSha = execSync(`git rev-parse --verify "${sha}^{commit}"`, {
          cwd: worktreePath,
          encoding: 'utf-8',
        }).trim();
      } catch {
        throw new AppError('Commit not found in this worktree', { status: 404 });
      }

      // Ancestry check: `git merge-base --is-ancestor A B` exits 0 iff A is
      // reachable from B. We require sha to be an ancestor of HEAD.
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
