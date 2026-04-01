// Types
import type { ReviewStatus } from '@atlas/shared';

export const STATUS_CONFIG: Record<ReviewStatus, { label: string; className: string }> = {
  pending: {
    label: 'Review Pending',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200',
  },
  changes_requested: {
    label: 'Changes Requested',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200',
  },
};
