import type { TaskPriority, TaskEstimate } from '@my-agents/shared';

export const priorityBadgeClass: Record<string, string> = {
  High: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  Medium: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  Low: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
};

export const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
export const ESTIMATES: TaskEstimate[] = ['S', 'M', 'L'];

export const NONE_VALUE = '__none__';
