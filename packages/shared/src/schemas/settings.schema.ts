import { z } from "zod";

export const GlobalInstructionsSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  updatedAt: z.string().datetime(),
});

export const CreateGlobalInstructionsSchema = GlobalInstructionsSchema.pick({
  content: true,
});

export const UpdateGlobalInstructionsSchema =
  CreateGlobalInstructionsSchema.partial();

export type GlobalInstructions = z.infer<typeof GlobalInstructionsSchema>;
export type CreateGlobalInstructions = z.infer<
  typeof CreateGlobalInstructionsSchema
>;
export type UpdateGlobalInstructions = z.infer<
  typeof UpdateGlobalInstructionsSchema
>;

export const DispatchRuleSchema = z.object({
  id: z.string().uuid(),
  pattern: z.string(),
  agentId: z.string().uuid(),
  skillId: z.string().uuid().nullable(),
  autoStart: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateDispatchRuleSchema = DispatchRuleSchema.pick({
  pattern: true,
  agentId: true,
  skillId: true,
  autoStart: true,
});

export const UpdateDispatchRuleSchema = CreateDispatchRuleSchema.partial();

export type DispatchRule = z.infer<typeof DispatchRuleSchema>;
export type CreateDispatchRule = z.infer<typeof CreateDispatchRuleSchema>;
export type UpdateDispatchRule = z.infer<typeof UpdateDispatchRuleSchema>;

export const McpConnectionInfoSchema = z.object({
  sseUrl: z.string(),
  messagesUrl: z.string(),
  cursorConfig: z.record(z.unknown()),
  claudeDesktopConfig: z.record(z.unknown()),
  stdioConfig: z.record(z.unknown()),
  instructions: z.record(z.string()),
});

export type McpConnectionInfo = z.infer<typeof McpConnectionInfoSchema>;
