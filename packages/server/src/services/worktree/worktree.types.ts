export interface DiffFile {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
  truncated?: boolean;
}

export type DiffSummary = {
  additions: number;
  deletions: number;
  filesChanged: number;
};

export type WorktreeDiffResult = {
  files: DiffFile[];
  summary: DiffSummary;
};

export type WorktreeCreateResult = {
  worktreePath: string;
  branchName: string;
};

// Single source of truth lives in @atlas/shared so the client and server
// agree on the shape of the commits endpoint response.
export type { WorktreeCommit } from '@atlas/shared';

/** Context the safety-net uses to pick a more informative commit message. */
export type EnsureChangesCommittedContext = {
  taskName?: string;
  stage?: string | null;
};
