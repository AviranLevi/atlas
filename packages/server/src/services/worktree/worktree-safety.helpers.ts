// External
import path from 'node:path';

// Repositories
import { workspacesRepository } from '../../db/repositories/index.js';

// Lib
import { activeProcesses } from '../orchestrator/shared/active-processes.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/worktree/worktree-safety.helpers.ts';

export type WorktreeUsageResult = {
  inUse: boolean;
  inUseBy: string | null;
};

/**
 * Checks whether another workspace has a live process with its cwd in the
 * given worktree path. Uses the in-memory `activeProcesses` map (Atlas
 * already tracks all child processes) rather than OS-level scanning.
 *
 * Also queries the DB for workspaces in running/pending status as a fallback
 * (catches edge cases where the process map is stale).
 */
export function isWorktreeInUse(worktreePath: string, excludeWorkspaceId?: string): WorktreeUsageResult {
  const FUNCTION_NAME = 'isWorktreeInUse';
  try {
    const normalizedPath = path.resolve(worktreePath);

    // Check activeProcesses map (in-memory, authoritative for live processes)
    for (const [wsId, entry] of activeProcesses.entries()) {
      if (wsId === excludeWorkspaceId) continue;
      if (!entry.process.killed && entry.process.pid) {
        const ws = workspacesRepository.findById(wsId);
        if (ws && path.resolve(ws.worktreePath) === normalizedPath) {
          return { inUse: true, inUseBy: wsId };
        }
      }
    }

    // Also check DB for workspaces in running/pending status with this path
    for (const status of ['running', 'pending'] as const) {
      const workspaces = workspacesRepository.findByStatus(status);
      for (const ws of workspaces) {
        if (ws.id === excludeWorkspaceId) continue;
        if (path.resolve(ws.worktreePath) === normalizedPath) {
          return { inUse: true, inUseBy: ws.id };
        }
      }
    }

    return { inUse: false, inUseBy: null };
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    return { inUse: false, inUseBy: null };
  }
}
