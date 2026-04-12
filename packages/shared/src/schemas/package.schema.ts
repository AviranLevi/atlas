import { z } from 'zod';
import { AgentSchema } from './agents.schema';
import { RuleSchema } from './rules.schema';
import { SkillSchema } from './skills.schema';

export const PackageTypeEnum = z.enum(['skill', 'rule', 'agent', 'collection']);

export const PackageMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semver (e.g. 1.0.0)'),
  author: z.string().default(''),
  tags: z.array(z.string()).default([]),
  license: z.string().optional(),
  atlasVersion: z.string().default('1.0'),
});

export const AgentExportSchema = AgentSchema.omit({
  id: true,
  providerId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  skills: z.array(SkillSchema.omit({ id: true, projectId: true, createdAt: true, updatedAt: true })).default([]),
  rules: z.array(RuleSchema.omit({ id: true, projectId: true, createdAt: true, updatedAt: true })).default([]),
});

export const CollectionSchema = z.object({
  skills: z.array(SkillSchema.omit({ id: true, projectId: true, createdAt: true, updatedAt: true })).default([]),
  rules: z.array(RuleSchema.omit({ id: true, projectId: true, createdAt: true, updatedAt: true })).default([]),
  agents: z.array(AgentExportSchema).default([]),
});

export const AtlasPackageSchema = z.object({
  schemaVersion: z.literal('1.0'),
  type: PackageTypeEnum,
  metadata: PackageMetadataSchema,
  content: z.union([
    SkillSchema.omit({ id: true, projectId: true, createdAt: true, updatedAt: true }),
    RuleSchema.omit({ id: true, projectId: true, createdAt: true, updatedAt: true }),
    AgentExportSchema,
    CollectionSchema,
  ]),
});

export const ImportPreviewItemSchema = z.object({
  type: PackageTypeEnum,
  name: z.string(),
  action: z.enum(['create', 'skip', 'rename']),
  renamedTo: z.string().optional(),
});

export const ImportResolutionSchema = z.object({
  name: z.string(),
  action: z.enum(['create', 'skip', 'rename']),
  renamedTo: z.string().optional(),
});

export const ImportPreviewSchema = z.object({
  items: z.array(ImportPreviewItemSchema),
  hasConflicts: z.boolean(),
});

export const ImportRequestSchema = z.object({
  package: AtlasPackageSchema,
  resolutions: z.array(ImportResolutionSchema),
  projectId: z.string().uuid().optional(),
});

export const ImportSummarySchema = z.object({
  created: z.number().int(),
  skipped: z.number().int(),
  renamed: z.number().int(),
});

export type PackageType = z.infer<typeof PackageTypeEnum>;
export type PackageMetadata = z.infer<typeof PackageMetadataSchema>;
export type AgentExport = z.infer<typeof AgentExportSchema>;
export type Collection = z.infer<typeof CollectionSchema>;
export type AtlasPackage = z.infer<typeof AtlasPackageSchema>;
export type ImportPreviewItem = z.infer<typeof ImportPreviewItemSchema>;
export type ImportResolution = z.infer<typeof ImportResolutionSchema>;
export type ImportPreview = z.infer<typeof ImportPreviewSchema>;
export type ImportRequest = z.infer<typeof ImportRequestSchema>;
export type ImportSummary = z.infer<typeof ImportSummarySchema>;
