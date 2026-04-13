// External
import fs from 'node:fs';
import path from 'node:path';

// Shared
import type { Workspace } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../db/repositories/index.js';

// Services
import { tasksService } from '../index.js';

// Lib
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/orchestrator/workspace-query.service.ts';
const OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'workspace-logs');
const ARCHIVE_DIR = path.resolve(process.cwd(), 'data', 'archived-logs');

export class WorkspaceQueryService {
  /** Returns workspace status with optional full log output. */
  async getStatus(workspaceId: string): Promise<(Workspace & { fullOutput?: string }) | null> {
    const workspace = workspacesRepository.findById(workspaceId);

    // Return null for deleted workspaces
    // instead of throwing — avoids noisy 404 logs from polling clients.
    if (!workspace) return null;

    const logFile = path.join(OUTPUT_DIR, `${workspaceId}.log`);
    let fullOutput: string | undefined;
    if (fs.existsSync(logFile)) {
      fullOutput = fs.readFileSync(logFile, 'utf-8');
    }

    return { ...workspace, fullOutput };
  }

  /** Returns all pending and running workspaces. */
  async listActive(): Promise<Workspace[]> {
    return [...workspacesRepository.findByStatus('pending'), ...workspacesRepository.findByStatus('running')];
  }

  /** Returns all workspaces. */
  async listAll(): Promise<Workspace[]> {
    return workspacesRepository.findAll();
  }

  /**
   * Checks PIDs on startup and kills/marks orphaned workspaces as failed.
   * Handles two cases:
   *   1. Process is dead  -> just mark failed in DB (it already exited)
   *   2. Process is alive -> kill it (server restart doesn't mean the agent
   *      should keep running unattended) then mark failed
   */
  reconcileOnStartup(): void {
    const active = [...workspacesRepository.findByStatus('running'), ...workspacesRepository.findByStatus('pending')];

    for (const ws of active) {
      if (ws.pid) {
        let alive = false;
        try {
          process.kill(ws.pid, 0); // signal 0 = probe, throws if dead
          alive = true;
        } catch {
          // process already gone
        }

        if (alive) {
          logger.warn(
            `${FILE_PATH} :: reconcileOnStartup - PID ${ws.pid} still running after restart, killing it (workspace ${ws.id})`,
          );
          try {
            process.kill(ws.pid, 'SIGTERM');
            // Give it 3 s then force-kill
            setTimeout(() => {
              try {
                process.kill(ws.pid!, 'SIGKILL');
              } catch {
                /* already dead */
              }
            }, 3000);
          } catch {
            // already exited between probe and kill -- that's fine
          }
        } else {
          logger.warn(`${FILE_PATH} :: reconcileOnStartup - PID ${ws.pid} not found (workspace ${ws.id})`);
        }
      } else {
        logger.warn(`${FILE_PATH} :: reconcileOnStartup - workspace ${ws.id} has no PID recorded, marking failed`);
      }

      workspacesRepository.update(ws.id, {
        status: 'failed',
        completedAt: new Date().toISOString(),
      });

      // Reset the associated task so it surfaces back in the kanban
      tasksService.update(ws.taskId, { status: TASK_STATUS.TODO }).catch((e) => {
        logger.warn(`${FILE_PATH} :: reconcileOnStartup - failed to reset task status for workspace ${ws.id}`, e);
      });
    }

    if (active.length > 0) {
      logger.info(`${FILE_PATH} :: reconcileOnStartup - reconciled ${active.length} orphaned workspace(s)`);
    }
  }

  /** Lists metadata for all archived workspace log files. */
  listArchivedLogs(): { filename: string; size: number; createdAt: string }[] {
    if (!fs.existsSync(ARCHIVE_DIR)) return [];
    return fs
      .readdirSync(ARCHIVE_DIR)
      .filter((f) => f.endsWith('.log'))
      .map((filename) => {
        const stat = fs.statSync(path.join(ARCHIVE_DIR, filename));
        return { filename, size: stat.size, createdAt: stat.birthtime.toISOString() };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Returns the content of an archived log file. Prevents path traversal. */
  getArchivedLog(filename: string): string | null {
    // Prevent path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(ARCHIVE_DIR, safeName);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  }
}

export const workspaceQueryService = new WorkspaceQueryService();
