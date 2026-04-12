import { z } from 'zod';

export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  keyPrefix: z.string(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
});

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
});

export const CreateApiKeyResponseSchema = ApiKeySchema.extend({
  rawKey: z.string(),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKey = z.infer<typeof CreateApiKeySchema>;
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>;
