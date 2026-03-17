import { z } from "zod";
export const ProjectSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().nullable(),
    techStack: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const CreateProjectSchema = ProjectSchema.pick({
    name: true,
    description: true,
    techStack: true,
});
export const UpdateProjectSchema = CreateProjectSchema.partial();
//# sourceMappingURL=projects.schema.js.map