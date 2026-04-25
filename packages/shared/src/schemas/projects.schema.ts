import { z } from 'zod';

export const ProjectStatusEnum = z.enum(['active', 'on-hold', 'archived', 'completed']);
export const ProjectTypeEnum = z.enum(['frontend', 'backend', 'fullstack', 'library', 'mobile', 'cli', 'other']);

export const AiConfigSchema = z.object({
  source: z.string(),
  filePath: z.string(),
  name: z.string(),
  content: z.string(),
  type: z.string().min(1).optional(),
});

export const CreateBranchSchema = z.object({
  name: z.string().min(1).max(200),
  baseBranch: z.string().optional(),
});

export const ImportRulesSchema = z.object({
  items: z.array(AiConfigSchema).min(1),
});

export const ApprovalGatesSchema = z.object({
  brainstorm: z.boolean(),
  plan: z.boolean(),
});

export const AgentBehaviorSchema = z.object({
  requireVerification: z.boolean().default(true),
  enforceNoStubs: z.boolean().default(true),
  workflowMode: z.enum(['off', 'plan-only', 'full']).default('off'),
  autoAiReview: z.boolean().default(false),
  approvalGates: ApprovalGatesSchema.optional(),
});

export const ProjectScanDataSchema = z.object({
  projectType: ProjectTypeEnum.nullable().optional(),
  languages: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  envVars: z.array(z.string()).optional(),
  keyDirectories: z.record(z.string()).optional(),
  ports: z.array(z.number()).optional(),
  formatting: z
    .object({
      prettier: z.boolean().optional(),
      eslint: z.boolean().optional(),
      editorconfig: z.boolean().optional(),
      biome: z.boolean().optional(),
      config: z.record(z.unknown()).optional(),
    })
    .optional(),
  packageManager: z.string().nullable().optional(),
  cicd: z.string().nullable().optional(),
  monorepo: z.boolean().optional(),
  githubOwner: z.string().nullable().optional(),
  githubRepo: z.string().nullable().optional(),
  scripts: z.record(z.string()).optional(),
  aiConfigs: z.array(AiConfigSchema).optional(),
  scannedAt: z.string().optional(),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  techStack: z.string().nullable(),
  status: ProjectStatusEnum,
  repositoryUrl: z.string().nullable(),
  localPath: z.string().nullable(),
  defaultBranch: z.string().nullable(),
  scanData: ProjectScanDataSchema.nullable(),
  projectBrief: z.string().nullable(),
  designContext: z.string().nullable(),
  agentBehavior: AgentBehaviorSchema.nullable(),
  color: z.string().nullable(),
  mission: z.string().max(2000).nullable(),
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
  defaultBranch: z.string().nullable().optional(),
  scanData: ProjectScanDataSchema.nullable().optional(),
  projectBrief: z.string().nullable().optional(),
  designContext: z.string().nullable().optional(),
  agentBehavior: AgentBehaviorSchema.nullable().optional(),
  color: z.string().nullable().optional(),
  mission: z.string().max(2000).nullable().optional(),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export const ScaffoldProjectSchema = z.object({
  parentPath: z.string().min(1),
  folderName: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[^/\\:*?"<>|]+$/, 'Invalid folder name'),
  initGit: z.boolean().default(true),
  initialBranch: z.string().min(1).default('main'),
  projectName: z.string().min(1).max(100),
  color: z.string().nullable().optional(),
});

export type AgentBehavior = z.infer<typeof AgentBehaviorSchema>;
export type ApprovalGates = z.infer<typeof ApprovalGatesSchema>;
export type AiConfig = z.infer<typeof AiConfigSchema>;
export type CreateBranch = z.infer<typeof CreateBranchSchema>;
export type ImportRules = z.infer<typeof ImportRulesSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;
export type ProjectType = z.infer<typeof ProjectTypeEnum>;
export type ProjectScanData = z.infer<typeof ProjectScanDataSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type ScaffoldProject = z.infer<typeof ScaffoldProjectSchema>;
