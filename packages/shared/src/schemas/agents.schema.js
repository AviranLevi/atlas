import { z } from "zod";
export const AgentSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().nullable(),
    personality: z.string().nullable(),
    unbreakableRules: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const CreateAgentSchema = AgentSchema.pick({
    name: true,
    description: true,
    personality: true,
    unbreakableRules: true,
});
export const UpdateAgentSchema = CreateAgentSchema.partial();
//# sourceMappingURL=agents.schema.js.map