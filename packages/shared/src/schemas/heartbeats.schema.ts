import { z } from 'zod';

export const HeartbeatRunStatusEnum = z.enum(['triggered', 'working', 'completed', 'skipped', 'failed']);
export const HeartbeatRunResultEnum = z.enum(['task_started', 'no_work', 'daily_limit_reached', 'already_running']);

export const HeartbeatConfigSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  projectId: z.string().uuid().nullable(),
  runtime: z.string().min(1),
  cronExpression: z.string().min(1),
  enabled: z.boolean(),
  maxConcurrent: z.number().int().min(1).max(10),
  maxRunsPerDay: z.number().int().min(1).max(100),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateHeartbeatConfigSchema = z.object({
  agentId: z.string().uuid(),
  projectId: z.string().uuid().nullable().optional(),
  runtime: z.string().min(1),
  cronExpression: z.string().min(1),
  enabled: z.boolean().optional().default(false),
  maxConcurrent: z.number().int().min(1).max(10).optional().default(1),
  maxRunsPerDay: z.number().int().min(1).max(100).optional().default(5),
});

export const UpdateHeartbeatConfigSchema = CreateHeartbeatConfigSchema.omit({ agentId: true }).partial();

export const HeartbeatRunSchema = z.object({
  id: z.string().uuid(),
  configId: z.string().uuid(),
  agentId: z.string(),
  workspaceId: z.string().nullable(),
  status: HeartbeatRunStatusEnum,
  result: HeartbeatRunResultEnum.nullable(),
  triggeredAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

export type HeartbeatConfig = z.infer<typeof HeartbeatConfigSchema>;
export type CreateHeartbeatConfig = z.infer<typeof CreateHeartbeatConfigSchema>;
export type UpdateHeartbeatConfig = z.infer<typeof UpdateHeartbeatConfigSchema>;
export type HeartbeatRun = z.infer<typeof HeartbeatRunSchema>;
export type HeartbeatRunStatus = z.infer<typeof HeartbeatRunStatusEnum>;
export type HeartbeatRunResult = z.infer<typeof HeartbeatRunResultEnum>;
