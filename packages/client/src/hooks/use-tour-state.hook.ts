// FILE_PATH: packages/client/src/hooks/use-tour-state.hook.ts

// React / library
import { useCallback, useMemo } from 'react';

// Hooks
import { usePreferences, useUpdatePreferences } from './use-preferences.hook';

// Types
import type { TourId } from '@/lib/tours/tour-types';

/**
 * Pref-key conventions (flat strings — see plan §7).
 *
 *   tours_paused                        → '"true"' | '"false"'
 *   tours.global_dismissals             → numeric counter (string-encoded)
 *   tour.<id>.completed                 → '"true"' once user finishes that tour
 *   tour.<id>.dismissed_at              → ISO timestamp the user last skipped
 *   tour.<id>.skip_count                → numeric counter (string-encoded)
 *   hint.<id>.seen                      → '"true"' (M7)
 */

const SNOOZE_DAYS = 7;
const FATIGUE_THRESHOLD = 3;

const TOURS_PAUSED_KEY = 'tours_paused';
const TOURS_GLOBAL_DISMISSALS_KEY = 'tours.global_dismissals';

function tourCompletedKey(id: TourId): string {
  return `tour.${id}.completed`;
}

function tourDismissedAtKey(id: TourId): string {
  return `tour.${id}.dismissed_at`;
}

function tourSkipCountKey(id: TourId): string {
  return `tour.${id}.skip_count`;
}

function isTrue(v: string | undefined): boolean {
  return v === 'true';
}

function asInt(v: string | undefined): number {
  const n = Number.parseInt(v ?? '0', 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Read-only access to tour state. Preference data is loaded once via
 * `usePreferences()` and decoded here so callers don't sprinkle string
 * keys everywhere.
 */
export function useTourState() {
  const { data, isLoading } = usePreferences();
  const prefs = data ?? {};

  const toursPaused = isTrue(prefs[TOURS_PAUSED_KEY]);
  const globalDismissals = asInt(prefs[TOURS_GLOBAL_DISMISSALS_KEY]);

  const isCompleted = useCallback((id: TourId) => isTrue(prefs[tourCompletedKey(id)]), [prefs]);

  const isSnoozed = useCallback(
    (id: TourId) => {
      const ts = prefs[tourDismissedAtKey(id)];
      if (!ts) return false;
      const dismissedAt = new Date(ts).getTime();
      if (Number.isNaN(dismissedAt)) return false;
      const elapsed = Date.now() - dismissedAt;
      return elapsed < SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    },
    [prefs],
  );

  return useMemo(
    () => ({
      isLoading,
      prefs,
      toursPaused,
      globalDismissals,
      isCompleted,
      isSnoozed,
      fatigueThreshold: FATIGUE_THRESHOLD,
    }),
    [isLoading, prefs, toursPaused, globalDismissals, isCompleted, isSnoozed],
  );
}

/**
 * Mutations for tour state. Returns a stable object with named writers.
 *
 * `markCompleted` / `markDismissed` are the two writers fired after a tour
 * resolves. `markDismissed` also bumps `tours.global_dismissals`; the hook
 * (`use-page-tour.hook.ts`) checks the counter and may call `pauseTours`
 * to enforce the auto-fatigue rule (3 skips ⇒ tours globally paused).
 */
export function useTourStateMutations() {
  const update = useUpdatePreferences();
  const { data } = usePreferences();
  const prefs = data ?? {};

  const writePref = useCallback((key: string, value: string) => update.mutateAsync({ [key]: value }), [update]);

  const markCompleted = useCallback((id: TourId) => writePref(tourCompletedKey(id), 'true'), [writePref]);

  const markDismissed = useCallback(
    async (id: TourId) => {
      const skipCount = asInt(prefs[tourSkipCountKey(id)]) + 1;
      const globalCount = asInt(prefs[TOURS_GLOBAL_DISMISSALS_KEY]) + 1;
      await update.mutateAsync({
        [tourDismissedAtKey(id)]: new Date().toISOString(),
        [tourSkipCountKey(id)]: String(skipCount),
        [TOURS_GLOBAL_DISMISSALS_KEY]: String(globalCount),
      });
      return globalCount;
    },
    [update, prefs],
  );

  const pauseTours = useCallback(() => writePref(TOURS_PAUSED_KEY, 'true'), [writePref]);
  const resumeTours = useCallback(() => writePref(TOURS_PAUSED_KEY, 'false'), [writePref]);

  /** Wipe completed/dismissed flags so a tour fires again. Used by help center. */
  const resetTour = useCallback(
    (id: TourId) =>
      update.mutateAsync({
        [tourCompletedKey(id)]: '',
        [tourDismissedAtKey(id)]: '',
        [tourSkipCountKey(id)]: '0',
      }),
    [update],
  );

  /** Wipe the global "stop interrupting me" counter — used when user resumes tours. */
  const resetGlobalDismissals = useCallback(() => writePref(TOURS_GLOBAL_DISMISSALS_KEY, '0'), [writePref]);

  return {
    markCompleted,
    markDismissed,
    pauseTours,
    resumeTours,
    resetTour,
    resetGlobalDismissals,
    isPending: update.isPending,
  };
}
