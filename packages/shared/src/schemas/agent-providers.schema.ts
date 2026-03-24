import { z } from "zod";

export const ProviderTypeEnum = z.enum([
  "anthropic",
  "openai",
  "google",
  "openai-compatible",
  "ollama",
]);

export const AgentProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: ProviderTypeEnum,
  apiKey: z.string().nullable(),
  baseUrl: z.string().nullable(),
  modelName: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateAgentProviderSchema = AgentProviderSchema.pick({
  name: true,
  type: true,
  apiKey: true,
  baseUrl: true,
  modelName: true,
});

export const UpdateAgentProviderSchema = CreateAgentProviderSchema.partial();

export const ProviderModelSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export type ProviderType = z.infer<typeof ProviderTypeEnum>;
export type AgentProvider = z.infer<typeof AgentProviderSchema>;
export type CreateAgentProvider = z.infer<typeof CreateAgentProviderSchema>;
export type UpdateAgentProvider = z.infer<typeof UpdateAgentProviderSchema>;
export type ProviderModel = z.infer<typeof ProviderModelSchema>;
