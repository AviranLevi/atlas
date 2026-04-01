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
    label: 'Completed',
    leftColor: '#22c55e',
    badgeClass:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
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
  { key: 'completed', label: 'Completed' },
  { key: 'merged', label: 'Merged' },
  { key: 'failed', label: 'Failed' },
  { key: 'stopped', label: 'Stopped' },
];
