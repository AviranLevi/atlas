// React / library
import { ClipboardList, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import React from 'react';

// Types
import type { ProjectStatus } from '@atlas/shared';

export const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  },
  'on-hold': {
    label: 'On Hold',
    className:
      'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  },
  archived: {
    label: 'Archived',
    className: 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
  },
  completed: {
    label: 'Completed',
    className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
};

export const taskStatusConfig: Record<string, { icon: React.ReactNode; className: string }> = {
  'To Do': { icon: React.createElement(ClipboardList, { className: 'h-4 w-4' }), className: 'text-muted-foreground' },
  'In Progress': {
    icon: React.createElement(Loader2, { className: 'h-4 w-4' }),
    className: 'text-blue-600 dark:text-blue-400',
  },
  'In Review': {
    icon: React.createElement(Clock, { className: 'h-4 w-4' }),
    className: 'text-yellow-600 dark:text-yellow-400',
  },
  Done: {
    icon: React.createElement(CheckCircle2, { className: 'h-4 w-4' }),
    className: 'text-green-600 dark:text-green-400',
  },
};

export const priorityBadgeClass: Record<string, string> = {
  High: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  Medium:
    'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  Low: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
};

/** Project types that have a UI surface and should show the Design Context section. */
export const UI_PROJECT_TYPES = new Set(['frontend', 'fullstack', 'mobile']);

export const SOURCE_LABELS: Record<string, string> = {
  cursor: 'Cursor',
  claude: 'Claude Code',
  copilot: 'GitHub Copilot',
  cline: 'Cline / Roo',
  generic: 'Agent Instructions',
};
