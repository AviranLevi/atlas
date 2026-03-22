import { z } from "zod";

export const AgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  personality: z.string().nullable(),
  unbreakableRules: z.string().nullable(),
  providerId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateAgentSchema = AgentSchema.pick({
  name: true,
  description: true,
  personality: true,
  unbreakableRules: true,
  providerId: true,
});

export const UpdateAgentSchema = CreateAgentSchema.partial();

export const ProjectAgentSchema = z.object({
  agentId: z.string().uuid(),
  projectId: z.string().uuid(),
  role: z.string().nullable(),
});

export const AssignAgentSchema = z.object({
  agentId: z.string().uuid(),
  role: z.string().nullable().optional(),
});

export type Agent = z.infer<typeof AgentSchema>;
export type CreateAgent = z.infer<typeof CreateAgentSchema>;
export type UpdateAgent = z.infer<typeof UpdateAgentSchema>;
export type ProjectAgent = z.infer<typeof ProjectAgentSchema>;
export type AssignAgent = z.infer<typeof AssignAgentSchema>;
