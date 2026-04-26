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

export function isTourActive(): boolean {
  return active;
}

/** Returns true if the lock was acquired. False means another tour is running. */
export function acquire(): boolean {
  if (active) return false;
  active = true;
  return true;
}

export function release(): void {
  active = false;
}

/**
 * Test helper. Never call from production code.
 */
export function __resetTourLockForTests(): void {
  active = false;
}
