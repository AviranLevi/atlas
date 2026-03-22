import type { Task, TaskPriority, TaskEstimate } from '@my-agents/shared';

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

export type TaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultProjectId?: string;
};
