import type { ProjectStatus } from '@atlas/shared';

export const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300' },
  'on-hold': { label: 'On Hold', className: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' },
  archived: { label: 'Archived', className: 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400' },
  completed: { label: 'Completed', className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300' },
};
