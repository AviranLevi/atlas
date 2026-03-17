import { z } from "zod";
export const GlobalInstructionsSchema = z.object({
    id: z.string().uuid(),
    content: z.string(),
    updatedAt: z.string().datetime(),
});
export const CreateGlobalInstructionsSchema = GlobalInstructionsSchema.pick({
    content: true,
});
export const UpdateGlobalInstructionsSchema = CreateGlobalInstructionsSchema.partial();
export const DispatchRuleSchema = z.object({
    id: z.string().uuid(),
    pattern: z.string(),
    agentId: z.string().uuid(),
    skillId: z.string().uuid().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const CreateDispatchRuleSchema = DispatchRuleSchema.pick({
    pattern: true,
    agentId: true,
    skillId: true,
});
export const UpdateDispatchRuleSchema = CreateDispatchRuleSchema.partial();
//# sourceMappingURL=settings.schema.js.map