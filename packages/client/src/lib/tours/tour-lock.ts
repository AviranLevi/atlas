// FILE_PATH: packages/client/src/lib/tours/tour-lock.ts

/**
 * Module-scoped global lock that guarantees at most one tour is on screen
 * at any moment.
 *
 * The hook (`use-page-tour.hook.ts`) calls `acquire()` before starting a
 * tour and `release()` when Driver.js fires `destroyed`. If `acquire()`
 * returns false, the caller MUST abort silently — never queue.
 */

let active = false;
const subscribers = new Set<(active: boolean) => void>();

export function isTourActive(): boolean {
  return active;
}

/** Returns true if the lock was acquired. False means another tour is running. */
export function acquire(): boolean {
  if (active) return false;
  active = true;
  notify();
  return true;
}

export function release(): void {
  if (!active) return;
  active = false;
  notify();
}

/**
 * Subscribe to lock-state changes. Used by `useTourActive()` so HintDots
 * can hide themselves the moment a tour begins (plan §8 — "no two tours at
 * once" extends to the hint layer too).
 *
 * Returns an unsubscribe function.
 */
export function subscribe(listener: (active: boolean) => void): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function notify() {
  for (const fn of subscribers) fn(active);
}

/**
 * Test helper. Never call from production code.
 */
export function __resetTourLockForTests(): void {
  active = false;
  subscribers.clear();
}
