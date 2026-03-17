import { z } from "zod";
export const RuleTypeEnum = z.enum([
    "Backend",
    "Frontend",
    "Godot",
    "General",
]);
export const RuleSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(200),
    type: RuleTypeEnum,
    tags: z.array(z.string()),
    content: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const CreateRuleSchema = RuleSchema.pick({
    name: true,
    type: true,
    tags: true,
    content: true,
});
export const UpdateRuleSchema = CreateRuleSchema.partial();
//# sourceMappingURL=rules.schema.js.map