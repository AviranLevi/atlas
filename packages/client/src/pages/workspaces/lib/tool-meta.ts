// React / library
import { Terminal, FileCode, Eye, Globe, FolderSearch, Wrench } from 'lucide-react';

export type ToolMeta = {
  icon: typeof Terminal;
  label: string;
  colorClass: string;
};

const TOOL_META: Record<string, ToolMeta> = {
  run_shell_command: {
    icon: Terminal,
    label: 'Shell',
    colorClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  shell: {
    icon: Terminal,
    label: 'Shell',
    colorClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  bash: {
    icon: Terminal,
    label: 'Shell',
    colorClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  write_file: {
    icon: FileCode,
    label: 'Write File',
    colorClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  create_file: {
    icon: FileCode,
    label: 'Create File',
    colorClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  edit_file: {
    icon: FileCode,
    label: 'Edit File',
    colorClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  read_file: {
    icon: Eye,
    label: 'Read File',
    colorClass:
      'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
  },
  View: {
    icon: Eye,
    label: 'View',
    colorClass:
      'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
  },
  computer: {
    icon: Globe,
    label: 'Browser',
    colorClass:
      'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
  },
  browser: {
    icon: Globe,
    label: 'Browser',
    colorClass:
      'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
  },
  search: {
    icon: FolderSearch,
    label: 'Search',
    colorClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  grep: {
    icon: FolderSearch,
    label: 'Search',
    colorClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  list_directory: {
    icon: FolderSearch,
    label: 'List Dir',
    colorClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
};

const DEFAULT_META: ToolMeta = {
  icon: Wrench,
  label: 'Tool',
  colorClass:
    'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
};

/** Returns icon, label, and color classes for a given tool name. */
export function getToolMeta(toolName: string): ToolMeta {
  return TOOL_META[toolName] ?? DEFAULT_META;
}
