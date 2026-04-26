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
 */
export function buildDismissalPatch(
  id: TourId,
  prevSkipCount: number,
  prevGlobalDismissals: number,
  now: Date = new Date(),
): { patch: Record<string, string>; nextGlobalCount: number } {
  const nextSkipCount = prevSkipCount + 1;
  const nextGlobalCount = prevGlobalDismissals + 1;
  return {
    patch: {
      [tourDismissedAtKey(id)]: now.toISOString(),
      [tourSkipCountKey(id)]: String(nextSkipCount),
      [TOURS_GLOBAL_DISMISSALS_KEY]: String(nextGlobalCount),
    },
    nextGlobalCount,
  };
}
