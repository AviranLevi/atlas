import { z } from 'zod';

export const MemoryTypeEnum = z.enum(['Decision', 'Convention', 'Preference', 'Problem']);

export const MemoryScopeEnum = z.enum(['global', 'project']);

export const MemoryStatusEnum = z.enum(['active', 'superseded', 'archived']);

export const MemorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().max(200).nullable(),
  content: z.string(),
  type: MemoryTypeEnum.nullable(),
  scope: MemoryScopeEnum.nullable(),
  status: MemoryStatusEnum.default('active'),
  supersededBy: z.string().uuid().nullable(),
  isPinned: z.boolean().default(false),
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
  isPinned: z.boolean().optional(),
  lastUsed: z.string().datetime().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  agentId: z.string().uuid().nullable().optional(),
  /** If set, the memory with this ID will be marked as superseded when this memory is created. */
  supersedesId: z.string().uuid().optional(),
});

export const UpdateMemorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  type: MemoryTypeEnum.optional(),
  scope: MemoryScopeEnum.optional(),
  status: MemoryStatusEnum.optional(),
  isPinned: z.boolean().optional(),
  lastUsed: z.string().datetime().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  agentId: z.string().uuid().nullable().optional(),
});

export type MemoryType = z.infer<typeof MemoryTypeEnum>;
export type MemoryScope = z.infer<typeof MemoryScopeEnum>;
export type MemoryStatus = z.infer<typeof MemoryStatusEnum>;
export type Memory = z.infer<typeof MemorySchema>;
export type CreateMemory = z.infer<typeof CreateMemorySchema>;
export type UpdateMemory = z.infer<typeof UpdateMemorySchema>;
