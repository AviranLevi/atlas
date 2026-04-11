import { z } from 'zod';

export const IntegrationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  apiKey: z.string().nullable(),
  baseUrl: z.string().nullable(),
  enabled: z.boolean(),
  config: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UpsertIntegrationSchema = z.object({
  apiKey: z.string().nullable().optional(),
  baseUrl: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  config: z.string().nullable().optional(),
});

export const ObsidianConfigSchema = z.object({
  vaultPath: z.string().min(1),
  syncFolder: z.string().min(1).default('Atlas'),
  projectId: z.string().uuid().nullable(),
});

export type ObsidianConfig = z.infer<typeof ObsidianConfigSchema>;

export type Integration = z.infer<typeof IntegrationSchema>;
export type UpsertIntegration = z.infer<typeof UpsertIntegrationSchema>;
