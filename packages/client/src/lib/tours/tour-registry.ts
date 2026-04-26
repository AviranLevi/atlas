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
 * Empty until M4 — see plan §6 + §12.
 */
export const TOUR_LOADERS: Partial<Record<TourId, TourLoader>> = {
  // M4 — Wave 1
  // 'projects-dashboard': () => import('./definitions/projects-dashboard.tour').then((m) => m.default),
  // 'kanban': () => import('./definitions/kanban.tour').then((m) => m.default),
  // 'agents': () => import('./definitions/agents.tour').then((m) => m.default),
  //
  // M5 — Wave 2
  // 'workspaces': () => import('./definitions/workspaces.tour').then((m) => m.default),
  // 'workspace-detail': () => import('./definitions/workspace-detail.tour').then((m) => m.default),
  // 'chat': () => import('./definitions/chat.tour').then((m) => m.default),
  //
  // M6 — Wave 3
  // 'memory': () => import('./definitions/memory.tour').then((m) => m.default),
  // 'documents': () => import('./definitions/documents.tour').then((m) => m.default),
  // 'skills': () => import('./definitions/skills.tour').then((m) => m.default),
  // 'rules': () => import('./definitions/rules.tour').then((m) => m.default),
  // 'global': () => import('./definitions/global.tour').then((m) => m.default),
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
 * cheap to render even before any tour is loaded).
 *
 * NOTE: Currently empty — populated by M4–M6 alongside `TOUR_LOADERS`.
 */
export const TOUR_CATALOG: ReadonlyArray<{ id: TourId; title: string; description: string }> = [];

export function matchPage(page: string | RegExp, pathname: string): boolean {
  if (typeof page === 'string') {
    return pathname === page;
  }
  return page.test(pathname);
}
