import { z } from "zod";

export const WorkspaceStatusEnum = z.enum([
  'pending',
  'running',
  'completed',
  'failed',
  'stopped',
]);

export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  projectId: z.string().uuid(),
  agentId: z.string().uuid().nullable(),
  agentRuntime: z.string().min(1),
  branchName: z.string().min(1),
  worktreePath: z.string().min(1),
  pid: z.number().int().nullable(),
  status: WorkspaceStatusEnum,
  output: z.string().nullable(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateWorkspaceSchema = z.object({
  taskId: z.string().uuid(),
  agentRuntimeId: z.string().min(1),
});

export type WorkspaceStatus = z.infer<typeof WorkspaceStatusEnum>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type CreateWorkspace = z.infer<typeof CreateWorkspaceSchema>;
