import { z } from "zod";
import { CreateAgentSchema } from "./agents.schema";
import { CreateSkillSchema } from "./skills.schema";
import { CreateRuleSchema } from "./rules.schema";
import { ProviderTypeEnum } from "./agent-providers.schema";

export const PackageTypeEnum = z.enum(["agent", "skill", "rule"]);

export const PackageProviderHintSchema = z.object({
  type: ProviderTypeEnum,
  model: z.string().min(1),
});

export const PackageAgentSchema = CreateAgentSchema.omit({
  providerId: true,
  defaultModel: true,
}).extend({
  provider: PackageProviderHintSchema.optional(),
});

export const PackageSkillSchema = CreateSkillSchema.omit({ projectId: true });

export const PackageRuleSchema = CreateRuleSchema.omit({ projectId: true });

export const AtlasPackageSchema = z.object({
  atlas: z.literal("1.0"),
  type: PackageTypeEnum,
  name: z.string().min(1).max(200),
  version: z.string().min(1).max(50),
  description: z.string().optional().default(""),
  author: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  agent: PackageAgentSchema.optional(),
  skills: z.array(PackageSkillSchema).optional().default([]),
  rules: z.array(PackageRuleSchema).optional().default([]),
});

export const ImportResolutionSchema = z.object({
  action: z.enum(["create", "overwrite", "rename"]),
  rename: z.string().optional(),
});

export const ImportRequestSchema = z.object({
  package: AtlasPackageSchema,
  resolutions: z.object({
    agent: ImportResolutionSchema.optional(),
    skills: z.record(z.string(), ImportResolutionSchema).optional().default({}),
    rules: z.record(z.string(), ImportResolutionSchema).optional().default({}),
    providerId: z.string().uuid().nullable().optional(),
  }),
});

export type PackageType = z.infer<typeof PackageTypeEnum>;
export type PackageProviderHint = z.infer<typeof PackageProviderHintSchema>;
export type PackageAgent = z.infer<typeof PackageAgentSchema>;
export type PackageSkill = z.infer<typeof PackageSkillSchema>;
export type PackageRule = z.infer<typeof PackageRuleSchema>;
export type AtlasPackage = z.infer<typeof AtlasPackageSchema>;
export type ImportResolution = z.infer<typeof ImportResolutionSchema>;
export type ImportRequest = z.infer<typeof ImportRequestSchema>;
