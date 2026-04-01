import { z } from "zod";

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

export type BrowseQuery = z.infer<typeof BrowseQuerySchema>;
export type ScanQuery = z.infer<typeof ScanQuerySchema>;
export type ResetDatabase = z.infer<typeof ResetDatabaseSchema>;
export type TestSupermemory = z.infer<typeof TestSupermemorySchema>;
