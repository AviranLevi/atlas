import type { Task, Workspace, ExecutorStatus, ProviderModel } from '@atlas/shared';

export type RerunDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
  onSuccess?: (newWorkspace: Workspace) => void;
};

export type StartWorkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  agentName?: string;
  projectName?: string;
  projectId?: string;
};

export type ModelSectionProps = {
  runtime: ExecutorStatus;
  agentDefaultModel: string | null | undefined;
  selectedModel: string;
  customModelText: string;
  providerModels: ProviderModel[];
  providerModelsLoading: boolean;
  onModelChange: (value: string) => void;
  onCustomTextChange: (value: string) => void;
};

export type WorkspaceCardProps = {
  workspace: Workspace;
};

export type TaskSummaryProps = {
  name: string;
  projectName?: string;
  agentName?: string;
  priority: string | null;
};

export type RuntimeSelectProps = {
  runtimes: ExecutorStatus[];
  isLoading: boolean;
  value: string;
  onChange: (value: string) => void;
};

export type BranchSelectProps = {
  branches: string[];
  isLoading: boolean;
  value: string;
  onChange: (value: string) => void;
  defaultLabel: string;
};

export type DiffFile = {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
};

export type DiffResult = {
  files: DiffFile[];
  summary: { additions: number; deletions: number; filesChanged: number };
};
