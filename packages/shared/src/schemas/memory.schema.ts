import { z } from 'zod';

export const MemoryTypeEnum = z.enum(['Decision', 'Convention', 'Preference', 'Problem']);

export const MemoryScopeEnum = z.enum(['global', 'project']);

export const MemorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(200).nullable(),
  content: z.string(),
  type: MemoryTypeEnum.nullable(),
  scope: MemoryScopeEnum.nullable(),
  lastUsed: z.string().datetime().nullable(),
  projectId: z.string().uuid().nullable(),
  agentId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateMemorySchema = z.object({
  name: z.string().min(1).max(200),
  content: z.string().min(1),
  type: MemoryTypeEnum,
  scope: MemoryScopeEnum.optional().default('project'),
  lastUsed: z.string().datetime().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  agentId: z.string().uuid().nullable().optional(),
});

export const UpdateMemorySchema = CreateMemorySchema.partial();

export type MemoryType = z.infer<typeof MemoryTypeEnum>;
export type MemoryScope = z.infer<typeof MemoryScopeEnum>;
export type Memory = z.infer<typeof MemorySchema>;
export type CreateMemory = z.infer<typeof CreateMemorySchema>;
export type UpdateMemory = z.infer<typeof UpdateMemorySchema>;
