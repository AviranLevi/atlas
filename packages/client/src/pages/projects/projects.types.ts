// Types
import type { Project, Agent, Task } from '@atlas/shared';

export type TaskCounts = {
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  total: number;
};

export type ProjectWithSummary = Project & {
  taskCounts: TaskCounts;
  agentCount: number;
};

export type ProjectContext = {
  project: Project;
  agents: Agent[];
  tasks: Task[];
  memories: Array<Record<string, unknown>>;
};

export type ProjectCardProps = {
  project: ProjectWithSummary;
  onEdit: (e: React.MouseEvent, project: ProjectWithSummary) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onNavigate: (id: string) => void;
};
