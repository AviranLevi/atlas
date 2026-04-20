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
