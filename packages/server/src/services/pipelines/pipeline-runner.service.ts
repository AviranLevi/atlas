// Shared
import type { Pipeline, PipelineWithTasks } from '@atlas/shared';

// Repositories
import {
  agentsRepository,
  pipelinesRepository,
  tasksRepository,
  workspacesRepository,
} from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/pipelines/pipeline-runner.service.ts';

export class PipelineRunnerService {
  /**
   * Starts a pipeline: validates state and spawns the first queued task.
   * Runtime is resolved per-task from agent.defaultRuntimeId; fallback to explicit override.
   */
  async start(pipelineId: string, agentRuntimeId?: string): Promise<PipelineWithTasks> {
    const FUNCTION_NAME = 'start';
    try {
      const pipeline = pipelinesRepository.findWithTasks(pipelineId);
      if (!pipeline) throw new AppError('Pipeline not found', { status: 404 });

      if (pipeline.status === 'running') {
        throw new AppError('Pipeline is already running', { status: 400 });
      }
      if (pipeline.tasks.length === 0) {
        throw new AppError('Pipeline has no tasks', { status: 400 });
      }

      // Reset failed/skipped tasks so re-runs can advance (advance() only picks up 'queued')
      for (const task of pipeline.tasks) {
        if (task.status === 'failed' || task.status === 'skipped') {
          pipelinesRepository.updateTask(pipelineId, task.taskId, { status: 'queued' });
        }
      }

      pipelinesRepository.update(pipelineId, { status: 'running', currentTaskId: null });
      await this.advance(pipelineId, agentRuntimeId);
      return pipelinesRepository.findWithTasks(pipelineId)!;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to start pipeline', { cause: error });
    }
  }

  /**
   * Pauses a running pipeline. The active workspace keeps running;
   * `onWorkspaceTransition` will see the paused state and skip advancing.
   */
  async pause(pipelineId: string): Promise<Pipeline> {
    const FUNCTION_NAME = 'pause';
    try {
      const pipeline = pipelinesRepository.findByIdOrThrow(pipelineId);
      if (pipeline.status !== 'running') {
        throw new AppError('Pipeline is not running', { status: 400 });
      }
      return pipelinesRepository.update(pipelineId, { status: 'paused' });
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to pause pipeline', { cause: error });
    }
  }

  /**
   * Resumes a paused pipeline by spawning the next queued task.
   */
  async resume(pipelineId: string, agentRuntimeId?: string): Promise<PipelineWithTasks> {
    const FUNCTION_NAME = 'resume';
    try {
      const pipeline = pipelinesRepository.findByIdOrThrow(pipelineId);
      if (pipeline.status !== 'paused') {
        throw new AppError('Pipeline is not paused', { status: 400 });
      }
      pipelinesRepository.update(pipelineId, { status: 'running' });
      await this.advance(pipelineId, agentRuntimeId);
      return pipelinesRepository.findWithTasks(pipelineId)!;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to resume pipeline', { cause: error });
    }
  }

  /**
   * Cancels a pipeline: stops the active workspace (if any), marks remaining
   * queued tasks as 'skipped', marks pipeline 'failed'.
   */
  async cancel(pipelineId: string): Promise<PipelineWithTasks> {
    const FUNCTION_NAME = 'cancel';
    try {
      const pipeline = pipelinesRepository.findWithTasks(pipelineId);
      if (!pipeline) throw new AppError('Pipeline not found', { status: 404 });

      // Stop active workspace if one is running
      if (pipeline.currentTaskId) {
        const runningTask = pipeline.tasks.find((t) => t.taskId === pipeline.currentTaskId && t.workspaceId);
        if (runningTask?.workspaceId) {
          try {
            const { orchestratorService } = await import('../index.js');
            await orchestratorService.stopWork(runningTask.workspaceId);
          } catch (e) {
            logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to stop workspace`, e);
          }
        }
      }

      // Mark running task as failed, queued tasks as skipped
      for (const task of pipeline.tasks) {
        if (task.status === 'running') {
          pipelinesRepository.updateTask(pipeline.id, task.taskId, {
            status: 'failed',
            completedAt: new Date().toISOString(),
          });
        } else if (task.status === 'queued') {
          pipelinesRepository.updateTask(pipeline.id, task.taskId, { status: 'skipped' });
        }
      }

      pipelinesRepository.update(pipelineId, { status: 'failed', currentTaskId: null });
      return pipelinesRepository.findWithTasks(pipelineId)!;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to cancel pipeline', { cause: error });
    }
  }

  /**
   * Called by orchestrator hooks when a workspace changes state.
   * Decides whether to auto-review, auto-accept, or advance to the next task.
   *
   * @param workspaceId - the workspace that changed
   * @param newStatus   - 'completed' | 'approved'
   * @param agentRuntimeId - only required when newStatus === 'approved' (to spawn next task)
   */
  async onWorkspaceTransition(
    workspaceId: string,
    newStatus: 'completed' | 'approved' | 'failed' | 'stopped',
    agentRuntimeId?: string,
  ): Promise<void> {
    const FUNCTION_NAME = 'onWorkspaceTransition';
    try {
      const pipelineTask = pipelinesRepository.findTaskByWorkspace(workspaceId);
      if (!pipelineTask) return; // workspace not part of any pipeline

      const pipeline = pipelinesRepository.findById(pipelineTask.pipelineId);
      if (!pipeline) return;

      // Respect paused state — don't advance
      if (pipeline.status === 'paused' && newStatus !== 'failed' && newStatus !== 'stopped') return;

      if (newStatus === 'stopped') {
        // User manually stopped — pause pipeline, mark task queued so it can be re-run
        pipelinesRepository.updateTask(pipeline.id, pipelineTask.taskId, { status: 'queued' });
        pipelinesRepository.update(pipeline.id, { status: 'paused', currentTaskId: null });
        logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - pipeline ${pipeline.id} paused after manual stop`);
        return;
      }

      if (newStatus === 'failed') {
        // Mark this task failed, pause the pipeline so the user can intervene
        pipelinesRepository.updateTask(pipeline.id, pipelineTask.taskId, {
          status: 'failed',
          completedAt: new Date().toISOString(),
        });
        pipelinesRepository.update(pipeline.id, { status: 'paused', currentTaskId: null });
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - pipeline ${pipeline.id} paused after task failure`);
        return;
      }

      if (newStatus === 'completed') {
        const ws = workspacesRepository.findById(workspaceId);
        const isWorkflowStage = ws?.workflowStage === 'brainstorm' || ws?.workflowStage === 'plan';

        // Only auto-review after execute stage (or non-workflow tasks).
        // Brainstorm/plan stage progression is handled by the orchestrator's
        // advanceWorkflow, not the pipeline runner.
        if (pipelineTask.autoReview && !isWorkflowStage) {
          try {
            const { orchestratorService } = await import('../index.js');
            if (ws) {
              await orchestratorService.startAiReview(workspaceId, ws.agentRuntime);
            }
          } catch (e) {
            logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to auto-trigger AI review for pipeline task`, e);
          }
        }
        // Either way, wait for 'approved' before advancing
        return;
      }

      if (newStatus === 'approved') {
        // Mark the current pipeline task complete
        pipelinesRepository.updateTask(pipeline.id, pipelineTask.taskId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });

        // Advance to the next task — runtime resolved per-task from agent.defaultRuntimeId
        await this.advance(pipeline.id, agentRuntimeId);
      }
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      // Don't re-throw — this is a fire-and-forget hook called from completion callbacks
    }
  }

  // ── Private ──────────────────────────────────────────────────────────────

  /**
   * Finds the next queued task in the pipeline and spawns a workspace for it.
   * Resolves runtime per-task: agent.defaultRuntimeId → fallback override → error.
   */
  private async advance(pipelineId: string, fallbackRuntimeId?: string): Promise<void> {
    const FUNCTION_NAME = 'advance';

    const pipeline = pipelinesRepository.findWithTasks(pipelineId);
    if (!pipeline) return;

    const nextTask = pipeline.tasks.filter((t) => t.status === 'queued').sort((a, b) => a.position - b.position)[0];

    if (!nextTask) {
      // All tasks done — mark pipeline complete
      pipelinesRepository.update(pipelineId, { status: 'completed', currentTaskId: null });
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - pipeline ${pipelineId} completed`);
      return;
    }

    // Resolve runtime: task.agent.defaultRuntimeId → fallback → global default → error
    const resolvedRuntimeId = await this.resolveRuntime(nextTask.taskId, fallbackRuntimeId);
    if (!resolvedRuntimeId) {
      const reason = `Task "${nextTask.taskName ?? nextTask.taskId}" has no agent with a default runtime configured`;
      logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - ${reason}`);
      pipelinesRepository.update(pipelineId, { status: 'paused', currentTaskId: null });

      // Log so the user can see why the pipeline paused
      try {
        const { activityLogService } = await import('../index.js');
        activityLogService.log({
          projectId: pipeline.projectId,
          taskId: nextTask.taskId,
          eventType: 'pipeline_paused',
          description: `Pipeline paused: ${reason}`,
          metadata: { pipelineId },
        });
      } catch (e) {
        logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to log pipeline pause activity`, e);
      }
      return;
    }

    // Resolve base branch
    let baseBranch: string | undefined;
    if (nextTask.baseStrategy === 'previous' && nextTask.position > 0) {
      const prevTask = pipeline.tasks
        .filter((t) => t.position < nextTask.position && t.status === 'completed')
        .sort((a, b) => b.position - a.position)[0];

      if (prevTask?.workspaceId) {
        try {
          const ws = workspacesRepository.findById(prevTask.workspaceId);
          baseBranch = ws?.branchName ?? undefined;
        } catch {
          // fallback to main
        }
      }
    }

    try {
      const { orchestratorService } = await import('../index.js');
      const workspace = await orchestratorService.startWork(nextTask.taskId, resolvedRuntimeId, baseBranch);

      logger.info(
        `${FILE_PATH} :: ${FUNCTION_NAME} - workspace spawned: id=${workspace.id} for task ${nextTask.taskId}`,
      );

      pipelinesRepository.updateTask(pipelineId, nextTask.taskId, {
        status: 'running',
        workspaceId: workspace.id,
        startedAt: new Date().toISOString(),
      });

      // Verify workspaceId was persisted (guards against Drizzle set() silent misses)
      const check = pipelinesRepository.findTask(pipelineId, nextTask.taskId);
      if (check && !check.workspaceId) {
        logger.error(
          `${FILE_PATH} :: ${FUNCTION_NAME} - workspaceId NOT persisted after updateTask! workspace.id=${workspace.id}`,
        );
      }

      pipelinesRepository.update(pipelineId, { currentTaskId: nextTask.taskId });

      logger.info(
        `${FILE_PATH} :: ${FUNCTION_NAME} - pipeline ${pipelineId} advanced to task ${nextTask.taskId} (workspace ${workspace.id})`,
      );
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to spawn next task`, error);
      pipelinesRepository.update(pipelineId, { status: 'paused', currentTaskId: null });
    }
  }

  /**
   * Resolves the executor runtime for a task:
   *   1. task.agent.defaultRuntimeId (if task has an agent with a default runtime)
   *   2. fallback (explicit override from caller)
   *   3. global default from preferences (defaultExecutorId)
   *   4. null (no runtime available)
   */
  private async resolveRuntime(taskId: string, fallback?: string): Promise<string | null> {
    try {
      const task = tasksRepository.findById(taskId);
      if (task?.agentId) {
        const agent = agentsRepository.findById(task.agentId);
        if (agent?.defaultRuntimeId) return agent.defaultRuntimeId;
      }
    } catch (e) {
      logger.warn(`${FILE_PATH} :: resolveRuntime - failed to look up agent for task ${taskId}`, e);
    }

    if (fallback) return fallback;

    // Fall back to global default runtime from preferences
    try {
      const { preferencesService } = await import('../index.js');
      const globalDefault = await preferencesService.get('defaultExecutorId');
      if (globalDefault) return globalDefault;
    } catch (e) {
      logger.warn(`${FILE_PATH} :: resolveRuntime - failed to look up global default runtime`, e);
    }

    return null;
  }
}
