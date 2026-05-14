// Types
import type { Pipeline, PipelineTask, PipelineWithTasks, UpdatePipelineTask } from '@atlas/shared';

export type { Pipeline, PipelineTask, PipelineWithTasks };

export type PipelineStatusMeta = {
  label: string;
  badgeClass: string;
};

/** Data payload attached to each React Flow node in PipelineFlow. */
export interface PipelineTaskNodeData {
  task: PipelineTask;
  isCurrent: boolean;
  pipelineRunning: boolean;
  onUpdateTask: (data: UpdatePipelineTask) => void;
  [key: string]: unknown; // React Flow requires index signature
}
