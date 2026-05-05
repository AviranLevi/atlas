import { z } from 'zod';

// ── Enums ──────────────────────────────────────────────────────────────────

export const PipelineStatusEnum = z.enum(['idle', 'running', 'paused', 'completed', 'failed']);

export const PipelineTaskStatusEnum = z.enum(['queued', 'running', 'completed', 'failed', 'skipped']);

export const PipelineBaseStrategyEnum = z.enum(['previous', 'main']);

// ── Core shapes ────────────────────────────────────────────────────────────

export const PipelineSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string(),
  status: PipelineStatusEnum,
  currentTaskId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PipelineTaskSchema = z.object({
  pipelineId: z.string().uuid(),
  taskId: z.string().uuid(),
  position: z.number().int().nonnegative(),
  autoReview: z.boolean(),
  autoAccept: z.boolean(),
  baseStrategy: PipelineBaseStrategyEnum,
  status: PipelineTaskStatusEnum,
  workspaceId: z.string().uuid().nullable(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  // Enriched join fields
  taskName: z.string().optional(),
  taskStatus: z.string().optional(),
});

export const PipelineWithTasksSchema = PipelineSchema.extend({
  tasks: z.array(PipelineTaskSchema),
});

// ── Request bodies ─────────────────────────────────────────────────────────

export const CreatePipelineSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  tasks: z
    .array(
      z.object({
        taskId: z.string().uuid(),
        autoReview: z.boolean().default(false),
        autoAccept: z.boolean().default(false),
        baseStrategy: PipelineBaseStrategyEnum.default('previous'),
      }),
    )
    .min(1),
});

export const UpdatePipelineSchema = z.object({
  name: z.string().min(1).optional(),
  status: PipelineStatusEnum.optional(),
});

export const AddPipelineTasksSchema = z.object({
  tasks: z
    .array(
      z.object({
        taskId: z.string().uuid(),
        autoReview: z.boolean().default(false),
        autoAccept: z.boolean().default(false),
        baseStrategy: PipelineBaseStrategyEnum.default('previous'),
      }),
    )
    .min(1),
});

export const UpdatePipelineTaskSchema = z.object({
  autoReview: z.boolean().optional(),
  autoAccept: z.boolean().optional(),
  baseStrategy: PipelineBaseStrategyEnum.optional(),
});

export const ReorderPipelineTasksSchema = z.object({
  /** Ordered array of taskIds — must contain every taskId currently in the pipeline. */
  taskIds: z.array(z.string().uuid()).min(1),
});

export const StartPipelineSchema = z.object({
  agentRuntimeId: z.string().min(1),
});

// ── Inferred types ─────────────────────────────────────────────────────────

export type PipelineStatus = z.infer<typeof PipelineStatusEnum>;
export type PipelineTaskStatus = z.infer<typeof PipelineTaskStatusEnum>;
export type PipelineBaseStrategy = z.infer<typeof PipelineBaseStrategyEnum>;
export type Pipeline = z.infer<typeof PipelineSchema>;
export type PipelineTask = z.infer<typeof PipelineTaskSchema>;
export type PipelineWithTasks = z.infer<typeof PipelineWithTasksSchema>;
export type CreatePipeline = z.infer<typeof CreatePipelineSchema>;
export type UpdatePipeline = z.infer<typeof UpdatePipelineSchema>;
export type AddPipelineTasks = z.infer<typeof AddPipelineTasksSchema>;
export type UpdatePipelineTask = z.infer<typeof UpdatePipelineTaskSchema>;
export type ReorderPipelineTasks = z.infer<typeof ReorderPipelineTasksSchema>;
export type StartPipeline = z.infer<typeof StartPipelineSchema>;
