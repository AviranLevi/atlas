// FILE_PATH: packages/client/src/lib/tours/tour-targets.ts

/**
 * Central registry of every `data-tour` selector used by the onboarding
 * engine. Adding a step? Pick a key here, slap `data-tour={TOUR_TARGETS.x}`
 * on the JSX, and reference `TOUR_TARGETS.x` in the tour definition.
 *
 * Why centralise:
 *   1. Grep-ability — one file lists every onboarding hook in the app.
 *   2. Decouples tours from CSS classes / styling decisions.
 *   3. A dev-overlay (M8) can read this map and visualise unused targets.
 *
 * Convention: a value of `'foo-bar'` becomes the selector `[data-tour="foo-bar"]`.
 */
export const TOUR_TARGETS = {
  // M4 — Wave 1 (projects-dashboard, kanban, agents)
  projectsNewBtn: 'projects-new-btn',
  projectsCard: 'projects-card',
  projectsFilter: 'projects-filter',

  kanbanBoard: 'kanban-board',
  kanbanAddTask: 'kanban-add-task',
  kanbanTaskCard: 'kanban-task-card',
  kanbanFilterBar: 'kanban-filter-bar',

  agentsProviders: 'agents-providers',
  agentsAddProvider: 'agents-add-provider',
  agentsNewAgent: 'agents-new-agent',
  agentsImport: 'agents-import',
  agentsCard: 'agents-card',

  navWorkspaces: 'nav-workspaces',

  // M5 — Wave 2 (workspaces, workspace-detail, chat)
  workspacesStatusTabs: 'workspaces-status-tabs',
  workspacesRow: 'workspaces-row',

  workspaceRunReview: 'workspace-run-review',
  workspaceCliBanner: 'workspace-cli-banner',
  workspaceCleanup: 'workspace-cleanup',

  chatBackendSwitch: 'chat-backend-switch',
  chatProviderSelect: 'chat-provider-select',
  chatInput: 'chat-input',

  // M6 — Wave 3 (memory, documents, skills, rules, global)
  memoryNewBtn: 'memory-new-btn',
  memoryStatusFilter: 'memory-status-filter',

  documentsAiTypes: 'documents-ai-types',
  documentsCustomDoc: 'documents-custom-doc',

  skillsNewBtn: 'skills-new-btn',
  skillsImport: 'skills-import',
  skillsCard: 'skills-card',

  rulesTemplates: 'rules-templates',
  rulesNewBtn: 'rules-new-btn',

  globalDispatchTab: 'global-dispatch-tab',
  globalInstructions: 'global-instructions',

  // Layout / cross-cutting
  helpButton: 'help-button',
  mcpConfig: 'mcp-config',
} as const;

export type TourTargetKey = keyof typeof TOUR_TARGETS;

/** Build the actual CSS selector for a target key. */
export function selector(key: TourTargetKey): string {
  return `[data-tour="${TOUR_TARGETS[key]}"]`;
}
