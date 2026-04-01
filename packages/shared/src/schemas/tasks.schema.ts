import { z } from 'zod';

export const TaskStatusEnum = z.enum(['Backlog', 'To Do', 'In Progress', 'In Review', 'Done', 'Blocked']);

export const TaskPriorityEnum = z.enum(['Low', 'Medium', 'High']);

export const TaskEstimateEnum = z.enum(['S', 'M', 'L']);

export const TaskSourceEnum = z.enum(['human', 'agent', 'dispatch', 'github']);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum.nullable(),
  estimate: TaskEstimateEnum.nullable(),
  definitionOfDone: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  projectId: z.string().uuid().nullable(),
  agentId: z.string().uuid().nullable(),
  phaseId: z.string().uuid().nullable(),
  source: TaskSourceEnum.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateTaskSchema = z.object({
  name: z.string().min(1).max(200),
  status: TaskStatusEnum.optional().default(TaskStatusEnum.Enum['To Do']),
  priority: TaskPriorityEnum.optional(),
  estimate: TaskEstimateEnum.optional(),
  definitionOfDone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  agentId: z.string().uuid().nullable().optional(),
  phaseId: z.string().uuid().nullable().optional(),
  source: TaskSourceEnum.optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const TASK_STATUS = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
} as const satisfies Record<string, z.infer<typeof TaskStatusEnum>>;

export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;
export type TaskEstimate = z.infer<typeof TaskEstimateEnum>;
export type TaskSource = z.infer<typeof TaskSourceEnum>;
export type Task = z.infer<typeof TaskSchema>;
export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
