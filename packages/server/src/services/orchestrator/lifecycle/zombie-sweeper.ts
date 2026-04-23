// Shared
import { activeProcesses } from '../shared/active-processes.js';

// Lib
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'services/orchestrator/lifecycle/zombie-sweeper.ts';
const SWEEP_INTERVAL_MS = 60_000;

/**
 * Periodic safety net for the rare case where an agent child dies (crash, OOM,
 * kill -9 from outside) without `proc.on('close')` firing. Without this, the
 * workspace sits as 'running' with a dead PID until the next server restart.
 *
 * The sweep probes each tracked PID with signal 0 (kernel presence check).
 * If the PID is gone, we fire the stored onFailed callback — same path that
 * proc.on('close') would have taken, so DB + activity log stay consistent.
 */
export function startZombieSweeper(): NodeJS.Timeout {
  const iv = setInterval(() => {
    for (const [workspaceId, entry] of activeProcesses) {
      const pid = entry.process.pid;
      if (!pid) continue;
      try {
        process.kill(pid, 0);
        continue; // still alive
      } catch {
        // PID gone — the process died without firing proc.on('close').
      }
      logger.warn(`${FILE_PATH} :: zombie-sweep - workspace ${workspaceId} PID ${pid} is dead; firing onFailed`);
      try {
        entry.onFailed('[zombie-sweep] process vanished without emitting close event', 'process not found');
      } catch (e) {
        logger.warn(`${FILE_PATH} :: zombie-sweep onFailed threw`, e);
      }
    }
  }, SWEEP_INTERVAL_MS);
  iv.unref();
  logger.info(`${FILE_PATH} :: startZombieSweeper - sweeping every ${SWEEP_INTERVAL_MS}ms`);
  return iv;
}
