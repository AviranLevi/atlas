// DB
import type { projects, tasks, workspaces } from '../../schema/index.js';

export type WorkspaceRow = typeof workspaces.$inferSelect;

export type WorkspaceJoinRow = {
  workspaces: WorkspaceRow;
  tasks: typeof tasks.$inferSelect | null;
  projects: typeof projects.$inferSelect | null;
};

export type InsertWorkspace = {
  taskId: string;
  projectId: string;
  agentId?: string | null;
  agentRuntime: string;
  model?: string | null;
  branchName: string;
  baseBranch?: string | null;
  worktreePath: string;
  pid?: number | null;
  status?: string;
  output?: string | null;
  workflowStage?: string | null;
  parentWorkspaceId?: string | null;
  providerFallbackReason?: string | null;
  diffComments?: string | null;
  currentStage?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  costUsd?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateWorkspace = Partial<Omit<InsertWorkspace, 'taskId' | 'projectId'>>;
