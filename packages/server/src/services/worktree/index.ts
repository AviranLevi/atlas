export { WorktreeService } from './worktree.service.js';
export type {
  DiffFile,
  DiffSummary,
  WorktreeDiffResult,
  WorktreeCreateResult,
  WorktreeCommit,
  EnsureChangesCommittedContext,
} from './worktree.types.js';
export { WORKSPACES_DIR, DIFF_EXCLUDE_PATTERNS, DIFF_MAX_BUFFER, PER_FILE_LINE_CAP } from './worktree.constants.js';
export { isWorktreeInUse } from './worktree-safety.helpers.js';
export type { WorktreeUsageResult } from './worktree-safety.helpers.js';
