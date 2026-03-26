import type { Task, TaskPriority, TaskEstimate } from '@atlas/shared';

export type KanbanCardActionsProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStartWork?: (task: Task) => void;
  canStartWork?: boolean;
  activeWorkspaceId?: string;
};

export type KanbanCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStartWork?: (task: Task) => void;
  isOverlay?: boolean;
  agentName?: string;
  projectName?: string;
  showProject?: boolean;
  canStartWork?: boolean;
  activeWorkspaceId?: string;
};

export type KanbanColumnProps = {
  status: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStartWork?: (task: Task) => void;
  agentMap: Map<string, string>;
  projectMap: Map<string, string>;
  showProject: boolean;
  canStartWork?: boolean;
  activeWorkspaceMap?: Map<string, string>;
};

export type FollowUpContext = {
  originalTaskName: string;
  workspaceId: string;
  output?: string;
};

export type TaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultProjectId?: string;
  followUpContext?: FollowUpContext;
};
