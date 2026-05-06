// External
import fs from 'node:fs';
import path from 'node:path';

// Services
import type { WorktreeService } from '../../../worktree/index.js';

// Lib
import { logger } from '../../../../lib/logger.js';
import { ensureGitignore } from '../spawn-gitignore.js';

const FILE_PATH = 'services/orchestrator/spawn/helpers/spawn-worktree-prep.helper.ts';

type PrepareWorktreeArgs = {
  worktreeService: WorktreeService;
  /** Absolute path to the project's root on disk. */
  localPath: string;
  /** Project's configured default branch, if any. */
  defaultBranch?: string | null;
  taskId: string;
  taskName: string;
  /** Explicit base branch from the caller, takes priority over defaultBranch. */
  baseBranch?: string;
  effectiveStage: 'brainstorm' | 'plan' | 'execute' | null;
};

type PrepareWorktreeResult = {
  worktreePath: string;
  branchName: string;
  /** The resolved base branch that was persisted with the workspace row. */
  persistedBaseBranch: string;
};

/**
 * Creates the git worktree, writes .gitignore, and (for execute stage) copies
 * the atlas-plan.md artifact so the agent has access to the approved plan.
 */
export function prepareWorktree({
  worktreeService,
  localPath,
  defaultBranch,
  taskId,
  taskName,
  baseBranch,
  effectiveStage,
}: PrepareWorktreeArgs): PrepareWorktreeResult {
  // Resolve which branch to base the worktree on:
  //   1. Explicit baseBranch from the request
  //   2. Project's configured default branch
  //   3. Auto-detect (main/master) — handled inside worktreeService.create
  const resolvedBaseBranch = baseBranch || defaultBranch || undefined;

  const { worktreePath, branchName } = worktreeService.create(localPath, taskId, taskName, resolvedBaseBranch);

  // Resolve the concrete base branch now so we can persist it on the workspace
  // row. resolvedBaseBranch may be undefined; fall through to auto-detect.
  const persistedBaseBranch = resolvedBaseBranch ?? worktreeService.getDefaultBranch(localPath);

  ensureGitignore(worktreePath);

  if (effectiveStage === 'execute') {
    const srcPlan = path.join(localPath, 'specs', 'atlas-plan.md');
    if (fs.existsSync(srcPlan)) {
      const destDir = path.join(worktreePath, 'specs');
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(srcPlan, path.join(destDir, 'atlas-plan.md'));
      logger.info(`${FILE_PATH} :: prepareWorktree - copied atlas-plan.md into worktree`);
    }
  }

  return { worktreePath, branchName, persistedBaseBranch };
}
