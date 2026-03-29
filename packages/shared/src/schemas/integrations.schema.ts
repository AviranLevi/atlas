import { z } from "zod";

export const IntegrationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  apiKey: z.string().nullable(),
  baseUrl: z.string().nullable(),
  enabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UpsertIntegrationSchema = z.object({
  apiKey: z.string().nullable().optional(),
  baseUrl: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
});

export type Integration = z.infer<typeof IntegrationSchema>;
export type UpsertIntegration = z.infer<typeof UpsertIntegrationSchema>;
