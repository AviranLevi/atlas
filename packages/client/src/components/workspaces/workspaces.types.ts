import type { Task, Workspace } from '@my-agents/shared';

export type StartWorkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  agentName?: string;
  projectName?: string;
  projectId?: string;
};

export type WorkspaceCardProps = {
  workspace: Workspace;
};
