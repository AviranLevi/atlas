import { z } from 'zod';

export const WorkspaceStatusEnum = z.enum([
  'pending',
  'running',
  'completed',
  'approved',
  'failed',
  'stopped',
  'merged',
]);

export const DiffCommentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  lineNumber: z.number().int(),
  lineContent: z.string(),
  body: z.string().min(1),
  parentId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export const AddDiffCommentSchema = z.object({
  filename: z.string().min(1),
  lineNumber: z.number().int(),
  lineContent: z.string(),
  body: z.string().min(1),
  parentId: z.string().optional(),
});

export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  projectId: z.string().uuid(),
  agentId: z.string().uuid().nullable(),
  agentRuntime: z.string().min(1),
  model: z.string().nullable(),
  branchName: z.string().min(1),
  baseBranch: z.string().nullable().optional(),
  worktreePath: z.string().min(1),
  pid: z.number().int().nullable(),
  status: WorkspaceStatusEnum,
  output: z.string().nullable(),
  workflowStage: z.enum(['brainstorm', 'plan', 'execute']).nullable().optional(),
  parentWorkspaceId: z.string().uuid().nullable().optional(),
  providerFallbackReason: z.string().nullable().optional(),
  diffComments: z.array(DiffCommentSchema).nullable().optional(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Enriched fields (joined at query time, not stored columns)
  taskName: z.string().optional(),
  projectName: z.string().optional(),
  inputTokens: z.number().int().nullable().optional(),
  outputTokens: z.number().int().nullable().optional(),
  costUsd: z.number().nullable().optional(),
});

export const CreateWorkspaceSchema = z.object({
  taskId: z.string().uuid(),
  agentRuntimeId: z.string().min(1),
  baseBranch: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  providerId: z.string().uuid().optional(),
  workflowEnabled: z.boolean().optional(),
});

// Rerun takes no body: the server reuses the prior workspace's runtime and
// model, and the provider is read from `task.workflowProviderId`. Keeping an
// empty object schema means the validator accepts `{}` (or any superset we
// ignore at the controller).
export const RerunWorkspaceSchema = z.object({}).passthrough();

export const CreatePullRequestSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
});

export const EditDiffCommentSchema = z.object({
  body: z.string().min(1),
});

/** Shape of a per-step commit the server parses out of `git log`. */
export const WorktreeCommitSchema = z.object({
  sha: z.string(),
  shortSha: z.string(),
  message: z.string(),
  author: z.string(),
  timestamp: z.string(),
  stepIndex: z.number().int().nullable(),
  stepTotal: z.number().int().nullable(),
  filesChanged: z.number().int(),
  insertions: z.number().int(),
  deletions: z.number().int(),
});

export const RevertWorkspaceSchema = z.object({
  commitSha: z.string().regex(/^[0-9a-f]{4,64}$/i, 'Invalid commit SHA'),
});

export const McpConfigFormatEnum = z.enum(['claude', 'cursor', 'generic-json', 'none']);

export const ModelPresetSchema = z.object({
  value: z.string(),
  label: z.string(),
  provider: z.string().optional(),
});

export const ProviderMappingSchema = z.object({
  providerType: z.string(),
  envVars: z.record(z.enum(['apiKey', 'baseUrl'])),
});

export const ExecutorStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  docsUrl: z.string().optional(),
  installed: z.boolean(),
  authenticated: z.boolean(),
  mcpConfigFormat: McpConfigFormatEnum,
  version: z.string().optional(),
  latestVersion: z.string().optional(),
  binaryPath: z.string().optional(),
  authHint: z.string().optional(),
  setup: z
    .object({
      install: z.string(),
      auth: z.string().optional(),
    })
    .optional(),
  modelFlag: z.string().optional(),
  defaultModel: z.string().optional(),
  modelPresets: z.array(ModelPresetSchema).optional(),
  providerMapping: z.array(ProviderMappingSchema).optional(),
  supportsCustomModel: z.boolean().optional(),
});

export type WorkspaceStatus = z.infer<typeof WorkspaceStatusEnum>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type CreateWorkspace = z.infer<typeof CreateWorkspaceSchema>;
export type McpConfigFormat = z.infer<typeof McpConfigFormatEnum>;
export type ModelPreset = z.infer<typeof ModelPresetSchema>;
export type ProviderMapping = z.infer<typeof ProviderMappingSchema>;
export type ExecutorStatus = z.infer<typeof ExecutorStatusSchema>;
export type DiffComment = z.infer<typeof DiffCommentSchema>;
export type AddDiffComment = z.infer<typeof AddDiffCommentSchema>;
export type RerunWorkspace = z.infer<typeof RerunWorkspaceSchema>;
export type CreatePullRequest = z.infer<typeof CreatePullRequestSchema>;
export type EditDiffComment = z.infer<typeof EditDiffCommentSchema>;
export type WorktreeCommit = z.infer<typeof WorktreeCommitSchema>;
export type RevertWorkspace = z.infer<typeof RevertWorkspaceSchema>;
