// Shared
import type { Project } from '@atlas/shared';

export type ProjectSummary = Project & {
  taskCounts: { todo: number; inProgress: number; inReview: number; done: number; total: number };
  agentCount: number;
};

export type ProjectContext = {
  project: Project;
  agents: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  memories: Record<string, unknown>[];
};
