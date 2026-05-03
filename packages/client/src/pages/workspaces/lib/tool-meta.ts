// React / library
import { Terminal, FileCode, Eye, Globe, FolderSearch, Wrench, CheckSquare, ListTodo } from 'lucide-react';

export type ToolMeta = {
  icon: typeof Terminal;
  label: string;
  colorClass: string;
};

const SHELL_META: ToolMeta = {
  icon: Terminal,
  label: 'Shell',
  colorClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
};

const WRITE_META: ToolMeta = {
  icon: FileCode,
  label: 'Write',
  colorClass:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

const READ_META: ToolMeta = {
  icon: Eye,
  label: 'Read',
  colorClass:
    'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
};

const SEARCH_META: ToolMeta = {
  icon: FolderSearch,
  label: 'Search',
  colorClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
};

const WEB_META: ToolMeta = {
  icon: Globe,
  label: 'Web',
  colorClass:
    'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
};

const TODO_META: ToolMeta = {
  icon: ListTodo,
  label: 'Todos',
  colorClass:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
};

const TASK_META: ToolMeta = {
  icon: CheckSquare,
  label: 'Task',
  colorClass:
    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
};

/**
 * Tool name → display metadata.
 *
 * Covers both lowercase legacy names (Aider/Gemini CLI) and PascalCase
 * names used by Claude Code's stream-json format.
 */
const TOOL_META: Record<string, ToolMeta> = {
  // ── Shell / Bash ──────────────────────────────────────────────────────────
  Bash: SHELL_META,
  bash: SHELL_META,
  shell: SHELL_META,
  run_shell_command: SHELL_META,

  // ── File writes / edits ───────────────────────────────────────────────────
  Write: WRITE_META,
  write_file: WRITE_META,
  create_file: { ...WRITE_META, label: 'Create' },
  Edit: { ...WRITE_META, label: 'Edit' },
  edit_file: { ...WRITE_META, label: 'Edit' },
  MultiEdit: { ...WRITE_META, label: 'Multi Edit' },
  NotebookEdit: { ...WRITE_META, label: 'Notebook Edit' },

  // ── File reads ────────────────────────────────────────────────────────────
  Read: READ_META,
  read_file: READ_META,
  View: READ_META,
  NotebookRead: READ_META,

  // ── Search / grep / ls ────────────────────────────────────────────────────
  Grep: SEARCH_META,
  grep: SEARCH_META,
  Glob: SEARCH_META,
  search: SEARCH_META,
  LS: { ...SEARCH_META, label: 'List Dir' },
  list_directory: { ...SEARCH_META, label: 'List Dir' },

  // ── Web ───────────────────────────────────────────────────────────────────
  WebSearch: { ...WEB_META, label: 'Web Search' },
  WebFetch: { ...WEB_META, label: 'Web Fetch' },
  computer: { ...WEB_META, label: 'Browser' },
  browser: { ...WEB_META, label: 'Browser' },

  // ── Todos ─────────────────────────────────────────────────────────────────
  TodoWrite: TODO_META,
  TodoRead: TODO_META,

  // ── Tasks / agents ────────────────────────────────────────────────────────
  Task: TASK_META,
};

const DEFAULT_META: ToolMeta = {
  icon: Wrench,
  label: 'Tool',
  colorClass:
    'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
};

/**
 * Returns icon, label, and color classes for a given tool name.
 * Tries exact match first, then case-insensitive fallback, then DEFAULT_META.
 */
export function getToolMeta(toolName: string): ToolMeta {
  return TOOL_META[toolName] ?? TOOL_META[toolName.toLowerCase()] ?? DEFAULT_META;
}
