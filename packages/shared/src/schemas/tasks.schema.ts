import { z } from "zod";

export const TaskStatusEnum = z.enum([
  "To Do",
  "In Progress",
  "In Review",
  "Done",
]);

export const TaskPriorityEnum = z.enum(["Low", "Medium", "High"]);

export const TaskEstimateEnum = z.enum(["S", "M", "L"]);

export const TaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum,
  estimate: TaskEstimateEnum,
  definitionOfDone: z.string().nullable(),
  notes: z.string().nullable(),
  projectId: z.string().uuid().nullable(),
  agentId: z.string().uuid().nullable(),
  skillId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateTaskSchema = z.object({
  name: z.string().min(1).max(200),
  status: TaskStatusEnum.optional().default('To Do'),
  priority: TaskPriorityEnum.optional(),
  estimate: TaskEstimateEnum.optional(),
  definitionOfDone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  agentId: z.string().uuid().nullable().optional(),
  skillId: z.string().uuid().nullable().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;
export type TaskEstimate = z.infer<typeof TaskEstimateEnum>;
export type Task = z.infer<typeof TaskSchema>;
export type CreateTask = z.infer<typeof CreateTaskSchema>;
export type UpdateTask = z.infer<typeof UpdateTaskSchema>;
