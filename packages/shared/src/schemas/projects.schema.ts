import { z } from "zod";

export const ProjectStatusEnum = z.enum(['active', 'on-hold', 'archived', 'completed']);

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  techStack: z.string().nullable(),
  status: ProjectStatusEnum,
  repositoryUrl: z.string().nullable(),
  localPath: z.string().nullable(),
  color: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  techStack: z.string().nullable().optional(),
  status: ProjectStatusEnum.optional().default('active'),
  repositoryUrl: z.string().nullable().optional(),
  localPath: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
