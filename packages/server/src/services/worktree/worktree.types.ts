export interface DiffFile {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
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
