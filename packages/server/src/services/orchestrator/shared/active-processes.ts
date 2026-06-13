// External
import type { ChildProcess } from 'node:child_process';

/**
 * Per-workspace bookkeeping for live agent child processes. Single struct so
 * the watchdog, zombie sweeper, and shutdown handler don't drift across
 * multiple parallel maps.
 */
export interface ActiveProcessEntry {
  process: ChildProcess;
  /**
   * The same `onFailed` callback passed to `spawnAgent`. Stored here so the
   * zombie sweeper and watchdog can fire the same failure path that
   * `proc.on('close')` would, guaranteeing DB/activity-log consistency.
   */
  onFailed: (output: string, error?: string) => void;
  /**
   * Optional compensating action to run when the user manually stops this
   * workspace (via `workspaceControlService.stopWork`). Used for operations
   * that mutate auxiliary state before spawning — e.g. `applyReviewFix`
   * flips the review to `pending` so a fresh review cycle can start, and
   * if the user stops mid-flight that mutation must be rolled back, or the
   * verdict panel disappears with no way to bring it back.
   *
   * Called exactly once, before `activeProcesses.delete`, and any throw is
   * caught so it never prevents the kill/cleanup path from completing.
   * Do not rely on it for the onFailed/onCompleted paths — those have
   * their own closures that already capture what they need.
   */
  onCancelled?: () => void;
  watchdogTimer?: NodeJS.Timeout;
  softWarnTimer?: NodeJS.Timeout;
  startedAt: number;
  stage: 'brainstorm' | 'plan' | 'execute' | 'review' | null;
}

/**
 * Module-level singleton that tracks all live agent child processes.
 * Shared across all orchestrator sub-services so they all operate on the same map.
 */
export const activeProcesses = new Map<string, ActiveProcessEntry>();

// Set to true once a shutdown signal (SIGINT/SIGTERM) is received. Spawn paths
// check this gate and refuse to start new work once set — prevents heartbeat
// cron or late HTTP requests from creating orphan children during shutdown.
let shuttingDown = false;

export function isShuttingDown(): boolean {
  return shuttingDown;
}

export function markShuttingDown(): void {
  shuttingDown = true;
}

/**
 * In-flight background spawns (`spawnInBackground`) that have started but not
 * yet registered a child in `activeProcesses`. A spawn lives here only during
 * its prompt-build → spawn → activate window. Tracked so graceful shutdown can
 * account for agents that are mid-spawn when a signal arrives, instead of
 * exiting out from under them and orphaning a just-spawned child.
 */
const pendingSpawns = new Set<Promise<unknown>>();

/** Registers an in-flight background spawn; auto-removes when it settles. */
export function trackPendingSpawn(promise: Promise<unknown>): void {
  pendingSpawns.add(promise);
  void promise.finally(() => pendingSpawns.delete(promise));
}

/** Number of background spawns currently mid-flight. */
export function pendingSpawnCount(): number {
  return pendingSpawns.size;
}

/** Resolves once every in-flight background spawn has settled. Never rejects. */
export function awaitPendingSpawns(): Promise<unknown> {
  return Promise.allSettled([...pendingSpawns]);
}

/** Clears any watchdog/softWarn timers attached to an entry. Safe to call multiple times. */
export function clearEntryTimers(entry: ActiveProcessEntry): void {
  if (entry.watchdogTimer) {
    clearTimeout(entry.watchdogTimer);
    entry.watchdogTimer = undefined;
  }
  if (entry.softWarnTimer) {
    clearTimeout(entry.softWarnTimer);
    entry.softWarnTimer = undefined;
  }
}
