// FILE_PATH: packages/client/src/lib/tours/tour-registry.ts

// Types
import type { TourDefinition, TourId } from './tour-types';

/**
 * Registry of tour definitions, lazy-loaded so we only pay the bundle cost
 * for the tour matching the current route.
 *
 * No tours are registered yet (the engine ships in M2 with zero content).
 * Each subsequent milestone (M4–M6) appends entries to `TOUR_LOADERS` —
 * never modify existing entries, only add new ones, since `tour.<id>.completed`
 * preferences are keyed off the tour ID.
 */

type TourLoader = () => Promise<TourDefinition>;

/**
 * Maps each TourId to a dynamic import that resolves to its definition.
 * Each entry is paid for only when the matching route is hit, so the
 * baseline bundle stays small. M4–M6 fill this in wave-by-wave.
 */
export const TOUR_LOADERS: Partial<Record<TourId, TourLoader>> = {
  // M4 — Wave 1
  'projects-dashboard': () => import('./definitions/projects-dashboard.tour').then((m) => m.default),
  kanban: () => import('./definitions/kanban.tour').then((m) => m.default),
  agents: () => import('./definitions/agents.tour').then((m) => m.default),
  //
  // M5 — Wave 2
  // workspace-detail must precede `workspaces` in catalog ordering only —
  // matching is route-pattern-based so loader order doesn't change behavior.
  workspaces: () => import('./definitions/workspaces.tour').then((m) => m.default),
  'workspace-detail': () => import('./definitions/workspace-detail.tour').then((m) => m.default),
  chat: () => import('./definitions/chat.tour').then((m) => m.default),
  //
  // M6 — Wave 3
  memory: () => import('./definitions/memory.tour').then((m) => m.default),
  documents: () => import('./definitions/documents.tour').then((m) => m.default),
  skills: () => import('./definitions/skills.tour').then((m) => m.default),
  rules: () => import('./definitions/rules.tour').then((m) => m.default),
  global: () => import('./definitions/global.tour').then((m) => m.default),
};

/**
 * In-memory cache of resolved tour definitions. The same definition is
 * served on subsequent loads; the cost is paid once per session per tour.
 */
const cache = new Map<TourId, TourDefinition>();

/**
 * Find the tour (if any) that matches the current pathname. Resolves to
 * `null` if no tour is registered for that route.
 */
export async function loadTourForRoute(pathname: string): Promise<TourDefinition | null> {
  for (const [id, loader] of Object.entries(TOUR_LOADERS) as [TourId, TourLoader][]) {
    const cached = cache.get(id);
    if (cached && matchPage(cached.page, pathname)) {
      return cached;
    }

    if (cached) {
      // Fast-fail: cached definition was for a different route.
      continue;
    }

    const def = await loader();
    cache.set(def.id, def);
    if (matchPage(def.page, pathname)) {
      return def;
    }
  }
  return null;
}

/**
 * Look up a tour by ID without considering route — for the help center
 * "Re-run any tour" button.
 */
export async function loadTourById(id: TourId): Promise<TourDefinition | null> {
  const cached = cache.get(id);
  if (cached) return cached;

  const loader = TOUR_LOADERS[id];
  if (!loader) return null;
  const def = await loader();
  cache.set(def.id, def);
  return def;
}

/**
 * Listed tour metadata for the help center (no `steps[]` payload, so
 * cheap to render even before any tour is loaded). Keep this list in
 * sync with `TOUR_LOADERS` — every loader entry should have a catalog
 * row, and vice-versa.
 */
export const TOUR_CATALOG: ReadonlyArray<{ id: TourId; title: string; description: string }> = [
  // M4 — Wave 1
  {
    id: 'projects-dashboard',
    title: 'Get oriented on projects',
    description: 'Tour the dashboard — create, find, and open projects.',
  },
  {
    id: 'kanban',
    title: 'Kanban basics',
    description: 'Columns, creating a task, dragging, running an agent.',
  },
  {
    id: 'agents',
    title: 'Set up agents',
    description: 'Wire up a model, build an agent, or import one from the community.',
  },
  // M5 — Wave 2
  {
    id: 'workspaces',
    title: 'Track agent runs',
    description: 'Stats, filters, and the run list — everything an agent has touched.',
  },
  {
    id: 'workspace-detail',
    title: 'Inside a workspace',
    description: 'Header status, AI review, follow-ups, and cleanup.',
  },
  {
    id: 'chat',
    title: 'Chat with your stack',
    description: 'Pick a backend, choose a model, and @-mention agents.',
  },
  // M6 — Wave 3
  {
    id: 'memory',
    title: 'Memories that stick',
    description: 'Decisions, conventions, and preferences agents recall across sessions.',
  },
  {
    id: 'documents',
    title: 'Generate and write docs',
    description: 'Auto-generate diagrams from code or hand-author a custom doc.',
  },
  {
    id: 'skills',
    title: 'Reusable skill templates',
    description: 'Build, import, and assign skills agents can pick up at run time.',
  },
  {
    id: 'rules',
    title: 'Coding standards for agents',
    description: 'Templates, custom rules, and how scoping works.',
  },
  {
    id: 'global',
    title: 'Global configuration',
    description: 'System-wide instructions and dispatch rules.',
  },
];

export function matchPage(page: string | RegExp, pathname: string): boolean {
  if (page instanceof RegExp) {
    return page.test(pathname);
  }
  // Support `:param` segments — e.g. `/workspaces/:id` matches `/workspaces/abc`.
  if (page.includes(':')) {
    const re = new RegExp(`^${page.replace(/:[^/]+/g, '[^/]+')}/?$`);
    return re.test(pathname);
  }
  return pathname === page;
}
