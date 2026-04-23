// Services
import { activityLogService } from '../../index.js';

// Lib
import { activeProcesses } from '../shared/active-processes.js';
import type { ActiveProcessEntry } from '../shared/active-processes.js';
import { getMaxRuntimeMs } from '../../../lib/runtime-limits.js';
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'services/orchestrator/review/watchdog.ts';

/**
 * Attaches watchdog + soft-warn timers to a live review/auto-fix workspace.
 * The budget is read off `entry.stage`:
 *   - 'review'  → short (default 15 min); reviewers don't write code
 *   - 'execute' → long  (default 60 min); applyReviewFix spawns an implementer
 * Missing/unknown stage falls back to the default execute budget — matches
 * `getMaxRuntimeMs`'s own fallback so we don't kill legitimate long runs by
 * mistake if a new caller forgets to set the stage.
 */
export function attachWatchdog(
  entry: ActiveProcessEntry,
  workspaceId: string,
  projectId: string,
  taskId: string,
  agentId: string | null,
  onFailed: (output: string, error?: string) => void,
): void {
  const stage = entry.stage;
  const maxRuntimeMs = getMaxRuntimeMs(stage);
  const stageLabel = stage ?? 'default';

  entry.softWarnTimer = setTimeout(() => {
    const remainingMs = maxRuntimeMs * 0.1;
    activityLogService.log({
      projectId,
      taskId,
      workspaceId,
      agentId,
      eventType: 'agent_warning',
      description: `Agent approaching runtime limit. Will terminate at ${new Date(Date.now() + remainingMs).toISOString()}.`,
      metadata: { maxRuntimeMs, stage: stageLabel },
    });
    logger.warn(
      `${FILE_PATH} :: watchdog - workspace ${workspaceId} (${stageLabel}) at 90% of ${maxRuntimeMs}ms budget`,
    );
  }, maxRuntimeMs * 0.9);
  entry.softWarnTimer.unref();

  entry.watchdogTimer = setTimeout(() => {
    logger.warn(
      `${FILE_PATH} :: watchdog - workspace ${workspaceId} (${stageLabel}) exceeded ${maxRuntimeMs}ms, terminating`,
    );
    const current = activeProcesses.get(workspaceId);
    if (!current) return;
    const proc = current.process;
    if (proc.pid) {
      try {
        process.kill(-proc.pid, 'SIGTERM');
      } catch {
        try {
          proc.kill('SIGTERM');
        } catch {
          /* already dead */
        }
      }
      setTimeout(() => {
        if (!proc.killed && proc.pid) {
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
      }, 5000).unref();
    }
    onFailed(`[watchdog] timeout: ${stageLabel} exceeded ${Math.round(maxRuntimeMs / 60_000)} minute limit`, 'timeout');
  }, maxRuntimeMs);
  entry.watchdogTimer.unref();
}
