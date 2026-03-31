export const RUNTIME_STORAGE_KEY = 'atlas:last-runtime';
export const MODEL_STORAGE_KEY = 'atlas:last-model';
export const DEFAULT_BRANCH_VALUE = '__default__';
export const NEW_BRANCH_VALUE = '__new_branch__';
export const DEFAULT_MODEL_VALUE = '__default_model__';
export const CUSTOM_MODEL_VALUE = '__custom__';

export function getModelStorageKey(runtimeId: string): string {
  return `${MODEL_STORAGE_KEY}:${runtimeId}`;
}

export const ESTIMATE_MODEL_HINT: Record<string, string> = {
  S: 'Haiku',
  M: 'Sonnet',
  L: 'Opus',
};

export function runningDuration(startedAt: string | null): string {
  if (!startedAt) return '--';
  const diff = Date.now() - new Date(startedAt).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export const ACTIVE_STATUSES: ReadonlySet<string> = new Set(['running', 'pending']);

export const WORKSPACE_TRANSITIONS: Record<string, { kind: 'success' | 'error'; verb: string }> = {
  completed: { kind: 'success', verb: 'completed' },
  merged:    { kind: 'success', verb: 'merged' },
  failed:    { kind: 'error',   verb: 'failed' },
};

export const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  },
  running: {
    label: 'Running',
    className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  completed: {
    label: 'Completed',
    className: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  },
  failed: {
    label: 'Failed',
    className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  },
  stopped: {
    label: 'Stopped',
    className: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300',
  },
};
