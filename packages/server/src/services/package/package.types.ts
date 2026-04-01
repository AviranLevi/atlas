// Shared
import type { PackageAgent, PackageProviderHint, PackageRule, PackageSkill } from '@atlas/shared';

export type ExistingEntity = {
  id: string;
  name: string;
};

export type ImportPreviewItem<T> = {
  data: T;
  conflict: ExistingEntity | null;
};

export type ImportPreview = {
  agent: ImportPreviewItem<PackageAgent> | null;
  skills: ImportPreviewItem<PackageSkill>[];
  rules: ImportPreviewItem<PackageRule>[];
  providerHint: {
    hint: PackageProviderHint;
    matchedProvider: ExistingEntity | null;
  } | null;
};

export type ImportSummary = {
  agentId: string | null;
  skillIds: string[];
  ruleIds: string[];
};
