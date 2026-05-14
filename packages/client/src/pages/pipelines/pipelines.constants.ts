// React / library
import { ListChecks, Play, Sparkles } from 'lucide-react';

// Types
import type { PipelineStatus, PipelineTaskStatus, WorkflowStage } from '@atlas/shared';
import type { PipelineStatusMeta } from './pipelines.types';

// ── Flow layout constants ──────────────────────────────────────────────────

export const PIPELINE_FLOW = {
  nodeWidth: 320,
  nodeHeight: 110,
  xGap: 0, // sequential, single column
  yGap: 160, // vertical spacing between nodes
  paddingY: 40,
  canvasMinHeight: 400,
} as const;

/** Border + bg per pipeline-task status, for the custom node. */
export const NODE_STATUS_STYLE: Record<PipelineTaskStatus, { border: string; bg: string; ring: string }> = {
  queued: { border: 'border-border', bg: 'bg-card', ring: '' },
  running: {
    border: 'border-blue-300',
    bg: 'bg-blue-50/60 dark:bg-blue-950/30',
    ring: 'ring-2 ring-blue-300/50',
  },
  completed: { border: 'border-green-300', bg: 'bg-green-50/60 dark:bg-green-950/30', ring: '' },
  failed: { border: 'border-red-300', bg: 'bg-red-50/60 dark:bg-red-950/30', ring: '' },
  skipped: { border: 'border-border/60', bg: 'bg-muted/30', ring: '' },
};

/** Edge stroke color per state. */
export const EDGE_STYLE = {
  pending: { stroke: 'hsl(var(--border))', width: 1.5, animated: false },
  active: { stroke: '#3b82f6', width: 2, animated: true },
  done: { stroke: '#22c55e', width: 2, animated: false },
  failed: { stroke: '#ef4444', width: 2, animated: false },
} as const;

export const PIPELINE_STATUS_META: Record<PipelineStatus, PipelineStatusMeta> = {
  idle: {
    label: 'Idle',
    badgeClass: 'border-border bg-muted text-muted-foreground',
  },
  running: {
    label: 'Running',
    badgeClass: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  },
  paused: {
    label: 'Paused',
    badgeClass:
      'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  completed: {
    label: 'Completed',
    badgeClass:
      'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300',
  },
  failed: {
    label: 'Failed',
    badgeClass: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
  },
};

export const TASK_STATUS_META: Record<PipelineTaskStatus, PipelineStatusMeta> = {
  queued: {
    label: 'Queued',
    badgeClass: 'border-border bg-muted text-muted-foreground',
  },
  running: {
    label: 'Running',
    badgeClass: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  },
  completed: {
    label: 'Done',
    badgeClass:
      'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-300',
  },
  failed: {
    label: 'Failed',
    badgeClass: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300',
  },
  skipped: {
    label: 'Skipped',
    badgeClass: 'border-border bg-muted/50 text-muted-foreground line-through',
  },
};

export const WORKFLOW_STAGE_META: Record<WorkflowStage, { label: string; icon: typeof Sparkles; badgeClass: string }> =
  {
    brainstorm: {
      label: 'Brainstorm',
      icon: Sparkles,
      badgeClass:
        'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
    },
    plan: {
      label: 'Plan',
      icon: ListChecks,
      badgeClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
    },
    execute: {
      label: 'Execute',
      icon: Play,
      badgeClass:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
  };
