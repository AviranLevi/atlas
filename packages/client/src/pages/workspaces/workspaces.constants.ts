// Shared
import type { Workspace } from '@atlas/shared';

// Types
import type { StatusFilter } from './workspaces.types';

export const statusMeta: Record<string, { label: string; leftColor: string; badgeClass: string }> = {
  pending: {
    label: 'Pending',
    leftColor: '#eab308',
    badgeClass:
      'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  },
  running: {
    label: 'Running',
    leftColor: '#3b82f6',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  completed: {
    // Demoted to neutral: the lifecycle chip above the row (Awaiting Approval /
    // Needs Review) already communicates what the user must do. Keeping this
    // badge green created three near-identical green chips on the same row.
    label: 'Completed',
    leftColor: '#64748b',
    badgeClass:
      'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
  },
  approved: {
    // Repainted from emerald to teal to disambiguate from the green `completed`
    // badge and the green `Review` chip.
    label: 'Approved',
    leftColor: '#14b8a6',
    badgeClass: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300',
  },
  failed: {
    label: 'Failed',
    leftColor: '#ef4444',
    badgeClass: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  },
  stopped: {
    label: 'Stopped',
    leftColor: '#6b7280',
    badgeClass: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400',
  },
  merged: {
    label: 'Merged',
    leftColor: '#8b5cf6',
    badgeClass:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
  },
};

export const filterTabs: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'awaitingApproval', label: 'Awaiting Approval' },
  { key: 'needsReview', label: 'Needs Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'merged', label: 'Merged' },
  { key: 'failed', label: 'Failed' },
  { key: 'stopped', label: 'Stopped' },
];

/**
 * Pure mapping from a workspace row to its lifecycle bucket. Every workspace
 * lands in exactly one bucket; the sum of bucket counts equals the total. This
 * is the single source of truth for both the tab filter and the summary tiles.
 *
 * Keep this aligned with `deriveWorkspaceView` in `workspace-view.ts` — both
 * classify brainstorm/plan stages as "structured" and everything else as
 * "flow", so `awaitingApproval` here matches the detail page's
 * `awaitingApproval` view kind.
 */
export type WorkspaceBucket = Exclude<StatusFilter, 'all'>;

export function bucketOfWorkspace(ws: Workspace): WorkspaceBucket {
  if (ws.status === 'running' || ws.status === 'pending') return 'active';
  if (ws.status === 'approved') return 'approved';
  if (ws.status === 'merged') return 'merged';
  if (ws.status === 'failed') return 'failed';
  if (ws.status === 'stopped') return 'stopped';
  // status === 'completed' — split by workflow stage category
  const stage = ws.workflowStage;
  const isStructured = stage === 'brainstorm' || stage === 'plan';
  return isStructured ? 'awaitingApproval' : 'needsReview';
}
