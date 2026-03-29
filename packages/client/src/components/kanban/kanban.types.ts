import type { Task, TaskPriority, TaskEstimate, TaskStatus } from '@atlas/shared';

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
  status: TaskStatus;
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
  defaultStatus?: TaskStatus;
  followUpContext?: FollowUpContext;
};

export type TaskAdvancedFieldsProps = {
  tagsInput: string;
  onTagsChange: (value: string) => void;
  phaseId: string;
  onPhaseChange: (value: string) => void;
  phases: { id: string; name: string }[];
  noneValue: string;
};

export type TaskCoreFieldsProps = {
  projectId: string;
  onProjectChange: (id: string) => void;
  agentId: string;
  onAgentChange: (id: string) => void;
  status: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  priority: TaskPriority;
  onPriorityChange: (priority: TaskPriority) => void;
  estimate: TaskEstimate;
  onEstimateChange: (estimate: TaskEstimate) => void;
  projects: { id: string; name: string }[];
  agents: { id: string; name: string }[];
};

export type BacklogListProps = {
  tasks: Task[];
  agentMap: Map<string, string>;
  projectMap: Map<string, string>;
  showProject: boolean;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPromote: (id: string) => void;
};
