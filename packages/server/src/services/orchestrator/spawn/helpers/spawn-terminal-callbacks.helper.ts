// Shared
import type { Workspace } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { workspacesRepository } from '../../../../db/repositories/index.js';

// Services
import { activityLogService, tasksService } from '../../../index.js';
import type { WorktreeService } from '../../../worktree/index.js';

// Lib
import { activeProcesses, clearEntryTimers } from '../../shared/active-processes.js';
import { logger } from '../../../../lib/logger.js';
import { notifyPipelineTransition } from './spawn-pipeline-notify.helper.js';

const FILE_PATH = 'services/orchestrator/spawn/helpers/spawn-terminal-callbacks.helper.ts';

type TaskStatusValue = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export type TerminalCallbacksOptions = {
  workspace: Workspace;
  worktreeService: WorktreeService;
  taskName: string;

  // --- Failed path ---

  /** Workspace status written on failure. Default: `'failed'` */
  failedStatus?: 'failed' | 'completed';
  /**
   * Task status to set on failure.
   * `null` = skip the update entirely. Default: `TASK_STATUS.TODO`
   */
  failedTaskStatus?: TaskStatusValue | null;
  /**
   * Prefix for the failure activity log description.
   * Final message: `${prefix}: ${error ?? 'unknown error'}`. Default: `'Agent failed'`
   */
  failedDescriptionPrefix?: string;
  /** Additional side-effect called after core failure handling completes. */
  onAfterFailed?: () => void;

  // --- Completed path ---

  /**
   * Task status to set on completion.
   * `null` = skip the update.
   * `undefined` (default) = auto-compute: AWAITING_APPROVAL for brainstorm/plan stages, IN_REVIEW otherwise.
   */
  completedTaskStatus?: TaskStatusValue | null;
  /** Activity log description on completion. Default: `'Agent completed successfully'` */
  completedDescription?: string;
  /** Additional side-effect called after core completion handling completes. */
  onAfterCompleted?: (output: string) => void;

  /**
   * Stage passed to `ensureChangesCommitted`.
   * Defaults to `workspace.workflowStage`.
   */
  commitStage?: 'brainstorm' | 'plan' | 'execute' | null;

  /**
   * When true, fires `pipelinesService.onWorkspaceTransition` on both paths
   * so the pipeline runner can auto-review or pause on failure.
   * Default: false
   */
  notifyPipeline?: boolean;
};

/**
 * Creates idempotent `onCompleted` and `onFailed` callbacks for a spawned agent.
 *
 * Shared lifecycle handled here:
 *   - Deduplication guard (fired flag + activeProcesses.has check)
 *   - activeProcesses cleanup + timer cancellation
 *   - Workspace DB update (status, output, completedAt)
 *   - Task status transition
 *   - Activity log entry
 *
 * Caller-specific behavior is injected via the options hooks (`onAfterFailed`,
 * `onAfterCompleted`) so each service can extend without copy-pasting the
 * boilerplate. The `failedStatus` and `completedTaskStatus` overrides cover the
 * review services' roll-back semantics.
 */
export function createTerminalCallbacks(opts: TerminalCallbacksOptions): {
  onCompleted: (output: string) => void;
  onFailed: (output: string, error?: string) => void;
} {
  let fired = false;

  // Returns false (bail) when the callback has already fired or when stopWork
  // already cleaned up the workspace (deleted from activeProcesses, set status
  // to 'stopped'). Without the has-check we would overwrite the 'stopped'
  // status and incorrect task state that stopWork just wrote.
  const dedupeCleanup = (): boolean => {
    if (fired) return false;
    if (!activeProcesses.has(opts.workspace.id)) return false;
    fired = true;
    const entry = activeProcesses.get(opts.workspace.id);
    if (entry) clearEntryTimers(entry);
    activeProcesses.delete(opts.workspace.id);
    return true;
  };

  const onFailed = (output: string, error?: string): void => {
    if (!dedupeCleanup()) return;

    const status = opts.failedStatus ?? 'failed';
    workspacesRepository.update(opts.workspace.id, {
      status,
      output,
      completedAt: new Date().toISOString(),
    });

    const taskStatus: TaskStatusValue | null =
      opts.failedTaskStatus === undefined ? TASK_STATUS.TODO : opts.failedTaskStatus;
    if (taskStatus !== null) {
      tasksService.update(opts.workspace.taskId, { status: taskStatus }).catch((e: unknown) => {
        logger.warn(`${FILE_PATH} :: onFailed - failed to reset task status`, e);
      });
    }

    activityLogService.log({
      projectId: opts.workspace.projectId,
      taskId: opts.workspace.taskId,
      workspaceId: opts.workspace.id,
      agentId: opts.workspace.agentId,
      eventType: 'agent_failed',
      description: `${opts.failedDescriptionPrefix ?? 'Agent failed'}: ${error ?? 'unknown error'}`,
      metadata: { error },
    });

    logger.error(`${FILE_PATH} :: onFailed - workspace ${opts.workspace.id}: ${error}`);

    opts.onAfterFailed?.();

    if (opts.notifyPipeline) {
      notifyPipelineTransition(opts.workspace.id, 'failed');
    }
  };

  const onCompleted = (output: string): void => {
    if (!dedupeCleanup()) return;

    // Safety net: commit any changes the agent left uncommitted.
    const commitStage =
      opts.commitStage !== undefined
        ? opts.commitStage
        : (opts.workspace.workflowStage as 'brainstorm' | 'plan' | 'execute' | null);
    opts.worktreeService.ensureChangesCommitted(opts.workspace.worktreePath, {
      taskName: opts.taskName,
      stage: commitStage,
    });

    workspacesRepository.update(opts.workspace.id, {
      status: 'completed',
      output,
      completedAt: new Date().toISOString(),
    });

    let taskStatus: TaskStatusValue | null;
    if (opts.completedTaskStatus !== undefined) {
      taskStatus = opts.completedTaskStatus;
    } else {
      const isWorkflowStage = opts.workspace.workflowStage === 'brainstorm' || opts.workspace.workflowStage === 'plan';
      taskStatus = isWorkflowStage ? TASK_STATUS.AWAITING_APPROVAL : TASK_STATUS.IN_REVIEW;
    }
    if (taskStatus !== null) {
      tasksService.update(opts.workspace.taskId, { status: taskStatus }).catch((e: unknown) => {
        logger.warn(`${FILE_PATH} :: onCompleted - failed to update task status`, e);
      });
    }

    activityLogService.log({
      projectId: opts.workspace.projectId,
      taskId: opts.workspace.taskId,
      workspaceId: opts.workspace.id,
      agentId: opts.workspace.agentId,
      eventType: 'agent_completed',
      description: opts.completedDescription ?? 'Agent completed successfully',
      metadata: {},
    });

    logger.info(`${FILE_PATH} :: onCompleted - workspace ${opts.workspace.id}`);

    opts.onAfterCompleted?.(output);

    if (opts.notifyPipeline) {
      notifyPipelineTransition(opts.workspace.id, 'completed', opts.workspace.agentRuntime);
    }
  };

  return { onCompleted, onFailed };
}
