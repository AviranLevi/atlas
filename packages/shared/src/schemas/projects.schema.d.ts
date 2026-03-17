import { z } from "zod";
export declare const ProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    techStack: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    techStack: string | null;
}, {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    techStack: string | null;
}>;
export declare const CreateProjectSchema: z.ZodObject<Pick<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    techStack: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "name" | "description" | "techStack">, "strip", z.ZodTypeAny, {
    name: string;
    description: string | null;
    techStack: string | null;
}, {
    name: string;
    description: string | null;
    techStack: string | null;
}>;
export declare const UpdateProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    techStack: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | null | undefined;
    techStack?: string | null | undefined;
}, {
    name?: string | undefined;
    description?: string | null | undefined;
    techStack?: string | null | undefined;
}>;
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
//# sourceMappingURL=projects.schema.d.ts.map