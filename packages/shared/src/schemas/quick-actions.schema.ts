import { z } from 'zod';

export const QuickActionTemplateSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  promptTemplate: z.string(),
  icon: z.string().nullable(),
});

export const QuickActionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  agentId: z.string().uuid().nullable(),
  promptTemplate: z.string().min(1),
  icon: z.string().nullable(),
  projectId: z.string().uuid().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateQuickActionSchema = z.object({
  name: z.string().min(1).max(100),
  promptTemplate: z.string().min(1),
  description: z.string().nullable().optional(),
  agentId: z.string().uuid().nullable().optional(),
  icon: z.string().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const UpdateQuickActionSchema = CreateQuickActionSchema.partial();

export type QuickAction = z.infer<typeof QuickActionSchema>;
export type CreateQuickAction = z.infer<typeof CreateQuickActionSchema>;
export type UpdateQuickAction = z.infer<typeof UpdateQuickActionSchema>;
export type QuickActionTemplate = z.infer<typeof QuickActionTemplateSchema>;
