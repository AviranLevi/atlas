// External
import type { ChildProcess } from 'node:child_process';

// Repositories
import { workspacesRepository } from '../../../../db/repositories/index.js';

// Lib
import { isShuttingDown } from '../../shared/active-processes.js';

/**
 * Kills the process and marks the workspace stopped if a shutdown signal
 * arrived after the spawn call. Returns true when it killed (caller throws 503).
 *
 * Race: isShuttingDown() was false at the top of startWork, but spawnAgent +
 * DB writes can take non-trivial time. If SIGINT arrived in that window the
 * shutdown handler snapshotted activeProcesses before we inserted our new
 * child — kill it now to prevent an orphan that survives process.exit.
 */
export function killOnShutdown(workspaceId: string, proc: ChildProcess): boolean {
  if (!isShuttingDown()) return false;

  if (proc.pid) {
    try {
      process.kill(-proc.pid, 'SIGKILL');
    } catch {
      try {
        proc.kill('SIGKILL');
      } catch {
        /* already dead */
      }
    }
  }

  workspacesRepository.update(workspaceId, {
    status: 'stopped',
    pid: proc.pid ?? null,
    completedAt: new Date().toISOString(),
  });

  return true;
}
