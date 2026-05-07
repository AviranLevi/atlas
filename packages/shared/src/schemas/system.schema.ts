import { z } from 'zod';

export const BrowseQuerySchema = z.object({
  path: z.string().optional(),
});

export const ScanQuerySchema = z.object({
  path: z.string().min(1),
});

export const ResetDatabaseSchema = z.object({
  confirm: z.literal(true),
});

export const TestSupermemorySchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
});

// ── System info & update types ────────────────────────────────────────────

export const SystemInfoSchema = z.object({
  version: z.string(),
  apiUrl: z.string(),
  dbPath: z.string(),
  dbSizeBytes: z.number(),
  uptimeSeconds: z.number(),
  nodeVersion: z.string(),
});

export const UpdateCheckResultSchema = z.object({
  current: z.string(),
  latest: z.string(),
  hasUpdate: z.boolean(),
  releaseUrl: z.string().nullable(),
});

export const UpdateProgressSchema = z.object({
  status: z.enum(['idle', 'updating', 'failed', 'completed']),
  step: z.string().optional(),
  steps: z.array(z.string()).optional(),
  currentStep: z.number().optional(),
  startedAt: z.string().optional(),
  error: z.string().nullable().optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────

export type BrowseQuery = z.infer<typeof BrowseQuerySchema>;
export type ScanQuery = z.infer<typeof ScanQuerySchema>;
export type ResetDatabase = z.infer<typeof ResetDatabaseSchema>;
export type TestSupermemory = z.infer<typeof TestSupermemorySchema>;
export type SystemInfo = z.infer<typeof SystemInfoSchema>;
export type UpdateCheckResult = z.infer<typeof UpdateCheckResultSchema>;
export type UpdateProgress = z.infer<typeof UpdateProgressSchema>;
