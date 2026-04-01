// Types
import type { PhaseStatus } from '@atlas/shared';

export const STATUS_LABELS: Record<PhaseStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  review: 'In Review',
  completed: 'Completed',
};

export const STATUS_COLORS: Record<PhaseStatus, string> = {
  planning: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};
