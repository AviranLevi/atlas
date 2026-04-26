// FILE_PATH: packages/client/src/lib/tours/tour-types.ts

/**
 * Canonical type contract for the onboarding tour engine.
 *
 * Tour definitions live in `tour-registry.ts` (one per page). The engine
 * (`tour-engine.ts`) is the only file that imports `driver.js`; everything
 * else trafficks in these types so we can swap the runtime later.
 */

/**
 * Stable IDs for every tour. Used as the prefix for all preference keys
 * (`tour.<id>.completed`, `tour.<id>.dismissed_at`).
 *
 * Add a new ID here, then register the matching `TourDefinition` in
 * `tour-registry.ts`. Never reuse an ID — completion state is keyed off it.
 */
export type TourId =
  | 'projects-dashboard'
  | 'kanban'
  | 'agents'
  | 'workspaces'
  | 'workspace-detail'
  | 'chat'
  | 'memory'
  | 'documents'
  | 'skills'
  | 'rules'
  | 'global';

export type TourStepSide = 'top' | 'bottom' | 'left' | 'right';
export type TourStepAlign = 'start' | 'center' | 'end';

export type TourStep = {
  /** CSS selector — always `[data-tour="..."]` (see `tour-targets.ts`). */
  selector: string;
  title: string;
  body: string;
  side?: TourStepSide;
  align?: TourStepAlign;
  /** Skip this step at runtime if the predicate returns false. */
  when?: () => boolean;
};

export type TourDefinition = {
  id: TourId;
  /**
   * Where this tour fires. A string is matched as a literal pathname; a regex
   * is run against `location.pathname`. The hook resolves at most one tour
   * per route.
   */
  page: string | RegExp;
  /** Shown in the help center and Settings → Onboarding row. */
  title: string;
  description: string;
  /** Hard gate — return false to skip the tour entirely (e.g. user has no projects). */
  prerequisites?: () => boolean;
  /** Always 1..5 steps. The plan caps tours at 5 — keep them short. */
  steps: [TourStep, ...TourStep[]];
};

export type TourOutcome = 'completed' | 'skipped' | 'aborted';

/**
 * Result of running a tour. The hook persists state based on this:
 * `completed` → `tour.<id>.completed = true`,
 * `skipped`   → `tour.<id>.dismissed_at = <iso>` and increments fatigue counter.
 */
export type TourRunResult = {
  outcome: TourOutcome;
  /** Step the user was on when they exited (0-indexed). */
  exitedAtStep: number;
};
