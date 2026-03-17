import { z } from "zod";
export const SkillTypeEnum = z.enum([
    "Planning",
    "Coding",
    "Review",
    "Architecture / Data",
    "Planning / Roadmapping",
    "Design / Systems",
    "Design",
    "Design / Balancing",
]);
export const SkillSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    type: SkillTypeEnum,
    steps: z.string().nullable(),
    inputFormat: z.string().nullable(),
    outputFormat: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const CreateSkillSchema = SkillSchema.pick({
    name: true,
    type: true,
    steps: true,
    inputFormat: true,
    outputFormat: true,
});
export const UpdateSkillSchema = CreateSkillSchema.partial();
//# sourceMappingURL=skills.schema.js.map