// External
import { execSync } from 'node:child_process';
import fs from 'node:fs';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

// Local
import { DIFF_MAX_BUFFER } from './worktree.constants.js';
import type { EnsureChangesCommittedContext, WorktreeCommit } from './worktree.types.js';

const FILE_PATH = 'services/worktree/worktree-commits.helpers.ts';

// Identity used for any commit Atlas creates on behalf of an agent.
// Agent step commits MUST also use these flags (enforced via prompt).
// Applied via -c flags so the user's global git config is never mutated.
const ATLAS_GIT_IDENTITY = '-c user.name="Atlas Agent" -c user.email="atlas@local"';

// A commit subject shaped like `step 3/7: add revert endpoint`. Captures:
//   1 = step index, 2 = step total, 3 = title.
// Tolerant of extra whitespace but requires both numbers and the colon.
const STEP_COMMIT_REGEX = /^step\s+(\d+)\s*\/\s*(\d+)\s*:\s*(.+)$/i;

/**
 * Safety net: commits any uncommitted changes left behind by the agent.
 * Returns true if a commit was created, false if the tree was already clean.
 */
export function ensureChangesCommitted(worktreePath: string, context?: EnsureChangesCommittedContext): boolean {
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
 * Lists commits on the worktree branch that are ahead of `baseRef`,
 * newest-first, enriched with numstat totals so the UI can render
 * "+X / -Y" without a second round-trip.
 */
export function listCommits(worktreePath: string, baseRef: string): WorktreeCommit[] {
  const FUNCTION_NAME = 'listCommits';
  try {
    if (!fs.existsSync(worktreePath)) {
      return [];
    }

    // %x00 acts as a record separator between commits. Leading NUL yields
    // clean [''/header+numstat] pairs after splitting.
    const FIELD_SEP = '\u001f';
    const format = `%x00${['%H', '%h', '%an', '%aI', '%s'].join(FIELD_SEP)}`;

    let raw: string;
    try {
      raw = execSync(`git log ${baseRef}..HEAD --format="${format}" --numstat`, {
        cwd: worktreePath,
        encoding: 'utf-8',
        maxBuffer: DIFF_MAX_BUFFER,
      });
    } catch (err) {
      // baseRef may not exist inside the worktree (shallow clones, missing
      // upstream). Fall back to HEAD's entire history as a best-effort.
      logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - ${baseRef}..HEAD failed, falling back to full HEAD history`, err);
      raw = execSync(`git log HEAD --format="${format}" --numstat`, {
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
