// Services
import { activityLogService } from '../../index.js';

// Orchestrator
import { activeProcesses } from '../shared/active-processes.js';
import type { ActiveProcessEntry } from '../shared/active-processes.js';
import type { RuntimeStage } from '../../../lib/runtime-limits.js';

// Lib
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'services/orchestrator/spawn/spawn-watchdog.ts';

type AttachWatchdogParams = {
  entry: ActiveProcessEntry;
  workspaceId: string;
  projectId: string;
  taskId: string;
  agentId: string | null;
  runtimeStage: RuntimeStage;
  maxRuntimeMs: number;
  onTimeout: (output: string, error: string) => void;
};

/**
 * Attaches the soft-warn (90%) and hard-kill (100%) timers to a freshly
 * spawned agent process entry. Both timers `.unref()` so they never
 * block process exit.
 */
export function attachWatchdog(params: AttachWatchdogParams): void {
  const { entry, workspaceId, projectId, taskId, agentId, runtimeStage, maxRuntimeMs, onTimeout } = params;

  // Soft warning at 90% of the limit — gives the user a heads-up in the
  // activity log so they can intervene before the hard kill.
  entry.softWarnTimer = setTimeout(() => {
    const remainingMs = maxRuntimeMs * 0.1;
    activityLogService.log({
      projectId,
      taskId,
      workspaceId,
      agentId,
      eventType: 'agent_warning',
      description: `Workspace approaching runtime limit. Will terminate at ${new Date(Date.now() + remainingMs).toISOString()}.`,
      metadata: { maxRuntimeMs, stage: runtimeStage },
    });
    logger.warn(`${FILE_PATH} :: watchdog - workspace ${workspaceId} at 90% of ${maxRuntimeMs}ms budget`);
  }, maxRuntimeMs * 0.9);
  entry.softWarnTimer.unref();

  // Hard kill at 100% — terminate process group and mark workspace failed.
  entry.watchdogTimer = setTimeout(() => {
    logger.warn(`${FILE_PATH} :: watchdog - workspace ${workspaceId} exceeded ${maxRuntimeMs}ms, terminating`);
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
      // Escalate to SIGKILL if the agent ignores SIGTERM.
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
    onTimeout(
      `[watchdog] timeout: workspace exceeded ${Math.round(maxRuntimeMs / 60_000)} minute limit`,
      'timeout',
    );
  }, maxRuntimeMs);
  entry.watchdogTimer.unref();
}
