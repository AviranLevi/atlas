// DB
import type { pipelines, pipelineTasks, tasks } from '../../schema/index.js';

export type PipelineRow = typeof pipelines.$inferSelect;
export type PipelineTaskRow = typeof pipelineTasks.$inferSelect;

export type PipelineTaskJoinRow = {
  pipeline_tasks: PipelineTaskRow;
  tasks: typeof tasks.$inferSelect | null;
};

export type InsertPipeline = {
  projectId: string;
  name: string;
  status?: string;
  currentTaskId?: string | null;
};

export type UpdatePipeline = Partial<Omit<InsertPipeline, 'projectId'>>;

export type InsertPipelineTask = {
  pipelineId: string;
  taskId: string;
  position: number;
  autoReview?: boolean;
  autoAccept?: boolean;
  baseStrategy?: string;
  status?: string;
  workspaceId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
};

export type UpdatePipelineTask = Partial<Omit<InsertPipelineTask, 'pipelineId' | 'taskId'>>;
