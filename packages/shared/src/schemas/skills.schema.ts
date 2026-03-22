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
  projectId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateSkillSchema = SkillSchema.pick({
  name: true,
  type: true,
  steps: true,
  inputFormat: true,
  outputFormat: true,
}).extend({
  projectId: z.string().uuid().nullable().optional(),
});

export const UpdateSkillSchema = CreateSkillSchema.partial();

export type SkillType = z.infer<typeof SkillTypeEnum>;
export type Skill = z.infer<typeof SkillSchema>;
export type CreateSkill = z.infer<typeof CreateSkillSchema>;
export type UpdateSkill = z.infer<typeof UpdateSkillSchema>;
