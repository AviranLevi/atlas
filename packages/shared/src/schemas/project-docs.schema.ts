import { z } from 'zod';

export const DocTypeEnum = z.enum(['api-diagram', 'db-schema', 'architecture', 'plan', 'custom']);
export const DocSourceEnum = z.enum(['user', 'ai']);

export const ProjectDocSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string(),
  type: DocTypeEnum,
  content: z.string(),
  source: DocSourceEnum,
  generatedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateProjectDocSchema = z.object({
  title: z.string().min(1),
  type: DocTypeEnum.optional().default('custom'),
  content: z.string().default(''),
});

export const UpdateProjectDocSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
});

export const GenerateDocSchema = z.object({
  type: z.enum(['api-diagram', 'db-schema', 'architecture']),
});

export type ProjectDoc = z.infer<typeof ProjectDocSchema>;
export type DocType = z.infer<typeof DocTypeEnum>;
export type DocSource = z.infer<typeof DocSourceEnum>;
export type CreateProjectDoc = z.infer<typeof CreateProjectDocSchema>;
export type UpdateProjectDoc = z.infer<typeof UpdateProjectDocSchema>;
export type GenerateDoc = z.infer<typeof GenerateDocSchema>;
