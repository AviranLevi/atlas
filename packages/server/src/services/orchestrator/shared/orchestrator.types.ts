// Services
import type { DiffFile } from '../../worktree/worktree.service.js';

export type DiffResult = {
  files: DiffFile[];
  summary: { additions: number; deletions: number; filesChanged: number };
};
