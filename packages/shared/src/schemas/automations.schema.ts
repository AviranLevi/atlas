import { z } from 'zod';

export const AutomationTemplateSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  promptTemplate: z.string(),
  icon: z.string().nullable(),
});

export const AutomationSchema = z.object({
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

export const CreateAutomationSchema = z.object({
  name: z.string().min(1).max(100),
  promptTemplate: z.string().min(1),
  description: z.string().nullable().optional(),
  agentId: z.string().uuid().nullable().optional(),
  icon: z.string().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const UpdateAutomationSchema = CreateAutomationSchema.partial();

export type Automation = z.infer<typeof AutomationSchema>;
export type CreateAutomation = z.infer<typeof CreateAutomationSchema>;
export type UpdateAutomation = z.infer<typeof UpdateAutomationSchema>;
export type AutomationTemplate = z.infer<typeof AutomationTemplateSchema>;
