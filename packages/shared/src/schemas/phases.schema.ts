import { z } from "zod";

export const PhaseStatusEnum = z.enum([
  "planning",
  "active",
  "review",
  "completed",
]);

export const PhaseSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  status: PhaseStatusEnum,
  orderIndex: z.number().int().min(0),
  taskCount: z.number().int().optional(),
  doneCount: z.number().int().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreatePhaseSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  status: PhaseStatusEnum.optional().default("planning"),
  orderIndex: z.number().int().min(0).optional().default(0),
});

export const UpdatePhaseSchema = CreatePhaseSchema.omit({ projectId: true }).partial();

export const ReorderPhaseSchema = z.object({
  newIndex: z.number().int().min(0),
});

export type PhaseStatus = z.infer<typeof PhaseStatusEnum>;
export type Phase = z.infer<typeof PhaseSchema>;
export type CreatePhase = z.infer<typeof CreatePhaseSchema>;
export type UpdatePhase = z.infer<typeof UpdatePhaseSchema>;
export type ReorderPhase = z.infer<typeof ReorderPhaseSchema>;
