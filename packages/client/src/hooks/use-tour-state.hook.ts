// FILE_PATH: packages/client/src/hooks/use-tour-state.hook.ts

// React / library
import { useCallback, useMemo } from 'react';

// Hooks
import { usePreferences, useUpdatePreferences } from './use-preferences.hook';

// Lib
import {
  asInt,
  buildCompletionPatch,
  buildDismissalPatch,
  FATIGUE_THRESHOLD,
  hintSeenKey,
  isTrue,
  isWithinSnooze,
  TOURS_GLOBAL_DISMISSALS_KEY,
  TOURS_PAUSED_KEY,
  tourCompletedCountKey,
  tourCompletedKey,
  tourDismissedAtKey,
  tourSkipCountKey,
  tourSkipStepSumKey,
} from '@/lib/tours/tour-state-helpers';

// Types
import type { HintId, TourId } from '@/lib/tours/tour-types';

/**
 * Pref-key conventions live in `tour-state-helpers.ts` (single source of
 * truth so tests can verify the exact payload shape without mounting React).
 *
 *   tours_paused                        → 'true' | 'false'
 *   tours.global_dismissals             → numeric counter (string-encoded)
 *   tour.<id>.completed                 → 'true' once user finishes that tour
 *   tour.<id>.dismissed_at              → ISO timestamp the user last skipped
 *   tour.<id>.skip_count                → numeric counter (string-encoded)
 *   hint.<id>.seen                      → 'true' (M7)
 */

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

  const isSnoozed = useCallback((id: TourId) => isWithinSnooze(prefs[tourDismissedAtKey(id)], Date.now()), [prefs]);

  const isHintSeen = useCallback((id: HintId) => isTrue(prefs[hintSeenKey(id)]), [prefs]);

  /**
   * M8 telemetry — read counters for a single tour. Pure derivation; never
   * triggers a write. `meanSkipStep` is null when there are no skips so
   * "0 skips → mean 0" can't be confused with "always skips at step 0".
   */
  const getTelemetry = useCallback(
    (id: TourId) => {
      const completedCount = asInt(prefs[tourCompletedCountKey(id)]);
      const skipCount = asInt(prefs[tourSkipCountKey(id)]);
      const skipStepSum = asInt(prefs[tourSkipStepSumKey(id)]);
      const meanSkipStep = skipCount > 0 ? skipStepSum / skipCount : null;
      return { completedCount, skipCount, meanSkipStep };
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
      isHintSeen,
      getTelemetry,
      fatigueThreshold: FATIGUE_THRESHOLD,
    }),
    [isLoading, prefs, toursPaused, globalDismissals, isCompleted, isSnoozed, isHintSeen, getTelemetry],
  );
}

/**
 * Mutations for tour state. Returns a stable object with named writers.
 *
 * `markCompleted` / `markDismissed` are the two writers fired after a tour
 * resolves. `markDismissed` also bumps `tours.global_dismissals` and returns
 * the new total; the hook (`use-page-tour.hook.ts`) checks the counter and
 * may call `pauseTours` to enforce the auto-fatigue rule (3 skips ⇒ tours
 * globally paused).
 *
 * `markHintSeen` is M7 territory but ships here so the state surface is
 * complete in one place.
 */
export function useTourStateMutations() {
  const update = useUpdatePreferences();
  const { data } = usePreferences();
  const prefs = data ?? {};

  const writePref = useCallback((key: string, value: string) => update.mutateAsync({ [key]: value }), [update]);

  const markCompleted = useCallback(
    async (id: TourId) => {
      const { patch } = buildCompletionPatch(id, asInt(prefs[tourCompletedCountKey(id)]));
      await update.mutateAsync(patch);
    },
    [update, prefs],
  );

  const markDismissed = useCallback(
    async (id: TourId, exitedAtStep: number = 0) => {
      const { patch, nextGlobalCount } = buildDismissalPatch(
        id,
        asInt(prefs[tourSkipCountKey(id)]),
        asInt(prefs[TOURS_GLOBAL_DISMISSALS_KEY]),
        asInt(prefs[tourSkipStepSumKey(id)]),
        exitedAtStep,
      );
      await update.mutateAsync(patch);
      return nextGlobalCount;
    },
    [update, prefs],
  );

  const pauseTours = useCallback(() => writePref(TOURS_PAUSED_KEY, 'true'), [writePref]);
  const resumeTours = useCallback(() => writePref(TOURS_PAUSED_KEY, 'false'), [writePref]);

  /** Wipe completed/dismissed flags so a tour fires again. Used by help center.
   * Telemetry counters (`completed_count`, `skip_step_sum`) are intentionally
   * preserved so a re-run from settings doesn't erase aggregate stats. */
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

  /** Mark a HintDot as seen (M7). One-shot — never re-armed except via "Reset hints". */
  const markHintSeen = useCallback((id: HintId) => writePref(hintSeenKey(id), 'true'), [writePref]);

  /** Wipe every `hint.*.seen` so dots re-appear. Used by help center "Reset hints". */
  const resetAllHints = useCallback(() => {
    const patch: Record<string, string> = {};
    for (const key of Object.keys(prefs)) {
      if (key.startsWith('hint.') && key.endsWith('.seen')) {
        patch[key] = '';
      }
    }
    if (Object.keys(patch).length === 0) return Promise.resolve(prefs);
    return update.mutateAsync(patch);
  }, [update, prefs]);

  return {
    markCompleted,
    markDismissed,
    pauseTours,
    resumeTours,
    resetTour,
    resetGlobalDismissals,
    markHintSeen,
    resetAllHints,
    isPending: update.isPending,
  };
}
