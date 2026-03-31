import { z } from "zod";

export const UsageLogSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().nullable(),
  conversationId: z.string().nullable(),
  agentId: z.string().nullable(),
  taskId: z.string().nullable(),
  projectId: z.string().nullable(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  totalTokens: z.number().int(),
  model: z.string().nullable(),
  providerType: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const UsageSummaryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  inputTokens: z.number().int(),
  outputTokens: z.number().int(),
  totalTokens: z.number().int(),
  runs: z.number().int(),
});

export const UsageSummarySchema = z.object({
  items: z.array(UsageSummaryItemSchema),
  totals: z.object({
    inputTokens: z.number().int(),
    outputTokens: z.number().int(),
    totalTokens: z.number().int(),
    runs: z.number().int(),
  }),
});

export type UsageLog = z.infer<typeof UsageLogSchema>;
export type UsageSummaryItem = z.infer<typeof UsageSummaryItemSchema>;
export type UsageSummary = z.infer<typeof UsageSummarySchema>;
