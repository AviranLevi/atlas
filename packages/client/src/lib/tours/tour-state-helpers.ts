// FILE_PATH: packages/client/src/lib/tours/tour-state-helpers.ts

// Types
import type { HintId, TourId } from './tour-types';

/**
 * Pure helpers for tour-state arithmetic. Kept separate from the hook so the
 * fatigue/snooze rules can be unit-tested without React, query-client, or
 * fetch mocking. The hook (`use-tour-state.hook.ts`) calls into these.
 *
 * Plan §3 invariants encoded here:
 *   - Snooze = 7 days (`SNOOZE_DAYS`).
 *   - Auto-pause at 3 dismissals (`FATIGUE_THRESHOLD`).
 *
 * If you change either constant, also update the help-center copy and the
 * acceptance criteria block in `docs/onboarding-tour-plan.md`.
 */

export const SNOOZE_DAYS = 7;
export const FATIGUE_THRESHOLD = 3;
export const SNOOZE_MS = SNOOZE_DAYS * 24 * 60 * 60 * 1000;

export const TOURS_PAUSED_KEY = 'tours_paused';
export const TOURS_GLOBAL_DISMISSALS_KEY = 'tours.global_dismissals';

export function tourCompletedKey(id: TourId): string {
  return `tour.${id}.completed`;
}

export function tourDismissedAtKey(id: TourId): string {
  return `tour.${id}.dismissed_at`;
}

export function tourSkipCountKey(id: TourId): string {
  return `tour.${id}.skip_count`;
}

/**
 * M8 telemetry — number of times the user reached the final step of this tour.
 * Distinct from `tour.<id>.completed` (boolean, one-shot) because re-runs from
 * Settings → Onboarding should also be counted.
 */
export function tourCompletedCountKey(id: TourId): string {
  return `tour.${id}.completed_count`;
}

/**
 * M8 telemetry — running sum of `exitedAtStep` across every skip. Combined
 * with `tour.<id>.skip_count` this yields the mean skip step (which lets us
 * tell "users skip at step 1" from "users skip at step 4").
 */
export function tourSkipStepSumKey(id: TourId): string {
  return `tour.${id}.skip_step_sum`;
}

export function hintSeenKey(id: HintId): string {
  return `hint.${id}.seen`;
}

export function isTrue(v: string | undefined): boolean {
  return v === 'true';
}

export function asInt(v: string | undefined): number {
  const n = Number.parseInt(v ?? '0', 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Returns true if a tour skipped at `dismissedAtISO` should still be
 * considered snoozed at `now`. Plan §3 rule 5.
 *
 * - Missing or empty timestamp → not snoozed.
 * - Unparseable timestamp → not snoozed (defensive — let the engine fire
 *   rather than wedge a user in a permanent snooze).
 */
export function isWithinSnooze(dismissedAtISO: string | undefined, now: number, snoozeMs: number = SNOOZE_MS): boolean {
  if (!dismissedAtISO) return false;
  const t = Date.parse(dismissedAtISO);
  if (Number.isNaN(t)) return false;
  return now - t < snoozeMs;
}

/**
 * Auto-pause invariant (plan §3 rule 6): the third dismissal flips
 * `tours_paused = true`. The threshold is inclusive — `count >= 3`.
 */
export function shouldAutoPause(globalDismissals: number, threshold: number = FATIGUE_THRESHOLD): boolean {
  return globalDismissals >= threshold;
}

/**
 * Build the preference patch written when a tour is marked `skipped`.
 * Centralised so the hook and tests agree on the exact payload.
 *
 * `prevSkipStepSum` and `exitedAtStep` are M8 telemetry counters — kept in the
 * same patch so the write is atomic with the dismissal flag.
 */
export function buildDismissalPatch(
  id: TourId,
  prevSkipCount: number,
  prevGlobalDismissals: number,
  prevSkipStepSum: number = 0,
  exitedAtStep: number = 0,
  now: Date = new Date(),
): { patch: Record<string, string>; nextGlobalCount: number } {
  const nextSkipCount = prevSkipCount + 1;
  const nextGlobalCount = prevGlobalDismissals + 1;
  const nextSkipStepSum = prevSkipStepSum + exitedAtStep;
  return {
    patch: {
      [tourDismissedAtKey(id)]: now.toISOString(),
      [tourSkipCountKey(id)]: String(nextSkipCount),
      [tourSkipStepSumKey(id)]: String(nextSkipStepSum),
      [TOURS_GLOBAL_DISMISSALS_KEY]: String(nextGlobalCount),
    },
    nextGlobalCount,
  };
}

/**
 * M8 telemetry — patch written on completion. Increments `completed_count`
 * alongside the `completed` boolean so re-runs from the help center are
 * counted too.
 */
export function buildCompletionPatch(
  id: TourId,
  prevCompletedCount: number,
): { patch: Record<string, string>; nextCompletedCount: number } {
  const nextCompletedCount = prevCompletedCount + 1;
  return {
    patch: {
      [tourCompletedKey(id)]: 'true',
      [tourCompletedCountKey(id)]: String(nextCompletedCount),
    },
    nextCompletedCount,
  };
}
