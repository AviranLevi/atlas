// Services
import type { DiffFile } from '../../worktree/index.js';

export type DiffResult = {
  files: DiffFile[];
  summary: { additions: number; deletions: number; filesChanged: number };
};
