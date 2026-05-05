// Shared
import type { Pipeline, PipelineWithTasks } from '@atlas/shared';

// Repositories
import { pipelinesRepository, workspacesRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/pipelines/pipeline-runner.service.ts';

export class PipelineRunnerService {
  /**
   * Starts a pipeline: validates state and spawns the first queued task.
   * `agentRuntimeId` is stored on the pipeline so `advance()` can reuse it.
   */
  async start(pipelineId: string, agentRuntimeId: string): Promise<PipelineWithTasks> {
    const FUNCTION_NAME = 'start';
    try {
      const pipeline = pipelinesRepository.findWithTasks(pipelineId);
      if (!pipeline) throw new AppError('Pipeline not found', { status: 404 });

      if (pipeline.status === 'running') {
        throw new AppError('Pipeline is already running', { status: 400 });
      }
      if (pipeline.status === 'completed') {
        throw new AppError('Pipeline is already completed', { status: 400 });
      }
      if (pipeline.tasks.length === 0) {
        throw new AppError('Pipeline has no tasks', { status: 400 });
      }

      // Store agentRuntimeId in name temporarily: not ideal, but avoids schema change.
      // We encode it into a separate field when we add pipeline.agentRuntimeId in a follow-up.
      // For now we pass it through advance() calls directly.

      pipelinesRepository.update(pipelineId, { status: 'running' });
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
  async resume(pipelineId: string, agentRuntimeId: string): Promise<PipelineWithTasks> {
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

      // Mark all queued tasks as skipped
      for (const task of pipeline.tasks) {
        if (task.status === 'queued') {
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
    newStatus: 'completed' | 'approved' | 'failed',
    agentRuntimeId?: string,
  ): Promise<void> {
    const FUNCTION_NAME = 'onWorkspaceTransition';
    try {
      const pipelineTask = pipelinesRepository.findTaskByWorkspace(workspaceId);
      if (!pipelineTask) return; // workspace not part of any pipeline

      const pipeline = pipelinesRepository.findById(pipelineTask.pipelineId);
      if (!pipeline) return;

      // Respect paused state — don't advance
      if (pipeline.status === 'paused' && newStatus !== 'failed') return;

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
        if (pipelineTask.autoReview) {
          // Trigger AI reviewer automatically — the reviewer's completion will
          // eventually call onWorkspaceTransition again (via submitAiReview or decide)
          // with 'approved' if autoAccept is also on. Nothing more to do here.
          try {
            const { orchestratorService } = await import('../index.js');
            const ws = workspacesRepository.findById(workspaceId);
            if (ws) {
              // agentRuntimeId stored on workspace row
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

        if (!agentRuntimeId) {
          // No runtime provided — pause so the user can resume manually
          pipelinesRepository.update(pipeline.id, { status: 'paused', currentTaskId: null });
          return;
        }

        // Advance to the next task
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
   * Marks pipeline complete when no queued tasks remain.
   */
  private async advance(pipelineId: string, agentRuntimeId: string): Promise<void> {
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
      const workspace = await orchestratorService.startWork(nextTask.taskId, agentRuntimeId, baseBranch);

      pipelinesRepository.updateTask(pipelineId, nextTask.taskId, {
        status: 'running',
        workspaceId: workspace.id,
        startedAt: new Date().toISOString(),
      });
      pipelinesRepository.update(pipelineId, { currentTaskId: nextTask.taskId });

      logger.info(
        `${FILE_PATH} :: ${FUNCTION_NAME} - pipeline ${pipelineId} advanced to task ${nextTask.taskId} (workspace ${workspace.id})`,
      );
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to spawn next task`, error);
      pipelinesRepository.update(pipelineId, { status: 'paused', currentTaskId: null });
    }
  }
}
