import { z } from 'zod';

export const McpServerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  command: z.string().min(1),
  args: z.string().nullable(),
  env: z.string().nullable(),
  enabled: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateMcpServerSchema = z.object({
  name: z.string().min(1).max(100),
  command: z.string().min(1),
  args: z.string().nullable().optional(),
  env: z.string().nullable().optional(),
  enabled: z.boolean().optional().default(true),
});

export const UpdateMcpServerSchema = CreateMcpServerSchema.partial();

export type McpServer = z.infer<typeof McpServerSchema>;
export type CreateMcpServer = z.infer<typeof CreateMcpServerSchema>;
export type UpdateMcpServer = z.infer<typeof UpdateMcpServerSchema>;
