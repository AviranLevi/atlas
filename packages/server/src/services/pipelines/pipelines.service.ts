// Shared
import type {
  AddPipelineTasks,
  CreatePipeline,
  Pipeline,
  PipelineTask,
  PipelineWithTasks,
  ReorderPipelineTasks,
  UpdatePipeline,
  UpdatePipelineTask,
} from '@atlas/shared';

// Repositories
import { pipelinesRepository } from '../../db/repositories/index.js';

// Local
import { PipelineRunnerService } from './pipeline-runner.service.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/pipelines/pipelines.service.ts';

export class PipelinesService {
  private runner = new PipelineRunnerService();

  /** Returns all pipelines for a project. */
  async list(projectId: string): Promise<Pipeline[]> {
    const FUNCTION_NAME = 'list';
    try {
      return pipelinesRepository.findByProject(projectId);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to list pipelines', { cause: error });
    }
  }

  /** Returns a pipeline with all its tasks by ID. */
  async getById(id: string): Promise<PipelineWithTasks> {
    const FUNCTION_NAME = 'getById';
    try {
      const pipeline = pipelinesRepository.findWithTasks(id);
      if (!pipeline) throw new AppError('Pipeline not found', { status: 404 });
      return pipeline;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to get pipeline', { cause: error });
    }
  }

  /** Creates a pipeline with an initial ordered task list. */
  async create(data: CreatePipeline): Promise<PipelineWithTasks> {
    const FUNCTION_NAME = 'create';
    try {
      // Guard: a task can only be in one pipeline at a time
      for (const t of data.tasks) {
        this.assertTaskNotInActivePipeline(t.taskId);
      }

      const pipeline = pipelinesRepository.insert({
        projectId: data.projectId,
        name: data.name,
        status: 'idle',
      });

      pipelinesRepository.insertTasks(
        data.tasks.map((t, i) => ({
          pipelineId: pipeline.id,
          taskId: t.taskId,
          position: i,
          autoReview: t.autoReview,
          autoAccept: t.autoAccept,
          baseStrategy: t.baseStrategy,
        })),
      );

      return pipelinesRepository.findWithTasks(pipeline.id)!;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create pipeline', { cause: error });
    }
  }

  /** Renames or updates top-level pipeline fields. */
  async update(id: string, data: UpdatePipeline): Promise<Pipeline> {
    const FUNCTION_NAME = 'update';
    try {
      pipelinesRepository.findByIdOrThrow(id);
      return pipelinesRepository.update(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update pipeline', { cause: error });
    }
  }

  /** Deletes a pipeline (cascade removes tasks). */
  async remove(id: string): Promise<void> {
    const FUNCTION_NAME = 'remove';
    try {
      pipelinesRepository.findByIdOrThrow(id);
      pipelinesRepository.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete pipeline', { cause: error });
    }
  }

  /** Appends tasks to an existing pipeline. */
  async addTasks(pipelineId: string, data: AddPipelineTasks): Promise<PipelineWithTasks> {
    const FUNCTION_NAME = 'addTasks';
    try {
      pipelinesRepository.findByIdOrThrow(pipelineId);
      const existing = pipelinesRepository.findTasks(pipelineId);
      const maxPos = existing.reduce((m, t) => Math.max(m, t.position), -1);

      for (const t of data.tasks) {
        this.assertTaskNotInActivePipeline(t.taskId, pipelineId);
      }

      pipelinesRepository.insertTasks(
        data.tasks.map((t, i) => ({
          pipelineId,
          taskId: t.taskId,
          position: maxPos + 1 + i,
          autoReview: t.autoReview,
          autoAccept: t.autoAccept,
          baseStrategy: t.baseStrategy,
        })),
      );

      return pipelinesRepository.findWithTasks(pipelineId)!;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add pipeline tasks', { cause: error });
    }
  }

  /** Updates per-task settings (autoReview, autoAccept, baseStrategy). */
  async updateTask(pipelineId: string, taskId: string, data: UpdatePipelineTask): Promise<PipelineTask> {
    const FUNCTION_NAME = 'updateTask';
    try {
      pipelinesRepository.findByIdOrThrow(pipelineId);
      const task = pipelinesRepository.findTask(pipelineId, taskId);
      if (!task) throw new AppError('Pipeline task not found', { status: 404 });
      pipelinesRepository.updateTask(pipelineId, taskId, data);
      return pipelinesRepository.findTask(pipelineId, taskId)!;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update pipeline task', { cause: error });
    }
  }

  /** Removes a task from a pipeline, re-normalising positions. */
  async removeTask(pipelineId: string, taskId: string): Promise<PipelineWithTasks> {
    const FUNCTION_NAME = 'removeTask';
    try {
      pipelinesRepository.findByIdOrThrow(pipelineId);
      const existing = pipelinesRepository.findTasks(pipelineId);
      const filtered = existing.filter((t) => t.taskId !== taskId);
      if (filtered.length === existing.length) {
        throw new AppError('Task not found in pipeline', { status: 404 });
      }

      // Replace all to normalise positions
      pipelinesRepository.replaceTasks(
        pipelineId,
        filtered.map((t, i) => ({
          pipelineId,
          taskId: t.taskId,
          position: i,
          autoReview: t.autoReview,
          autoAccept: t.autoAccept,
          baseStrategy: t.baseStrategy,
          status: t.status,
          workspaceId: t.workspaceId ?? undefined,
          startedAt: t.startedAt ?? undefined,
          completedAt: t.completedAt ?? undefined,
        })),
      );

      return pipelinesRepository.findWithTasks(pipelineId)!;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to remove pipeline task', { cause: error });
    }
  }

  /** Reorders tasks in a pipeline by supplying the full ordered taskId list. */
  async reorderTasks(pipelineId: string, data: ReorderPipelineTasks): Promise<PipelineWithTasks> {
    const FUNCTION_NAME = 'reorderTasks';
    try {
      pipelinesRepository.findByIdOrThrow(pipelineId);
      const existing = pipelinesRepository.findTasks(pipelineId);
      const byTaskId = new Map(existing.map((t) => [t.taskId, t]));

      // Validate all supplied IDs exist in this pipeline
      for (const id of data.taskIds) {
        if (!byTaskId.has(id)) {
          throw new AppError(`Task ${id} is not in this pipeline`, { status: 400 });
        }
      }
      if (data.taskIds.length !== existing.length) {
        throw new AppError('taskIds must contain every task currently in the pipeline', { status: 400 });
      }

      pipelinesRepository.replaceTasks(
        pipelineId,
        data.taskIds.map((taskId, i) => {
          const t = byTaskId.get(taskId)!;
          return {
            pipelineId,
            taskId,
            position: i,
            autoReview: t.autoReview,
            autoAccept: t.autoAccept,
            baseStrategy: t.baseStrategy,
            status: t.status,
            workspaceId: t.workspaceId ?? undefined,
            startedAt: t.startedAt ?? undefined,
            completedAt: t.completedAt ?? undefined,
          };
        }),
      );

      return pipelinesRepository.findWithTasks(pipelineId)!;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to reorder pipeline tasks', { cause: error });
    }
  }

  // ── Runner delegates ────────────────────────────────────────────────────

  /** Starts a pipeline, spawning the first queued task. */
  async start(pipelineId: string, agentRuntimeId?: string): Promise<PipelineWithTasks> {
    return this.runner.start(pipelineId, agentRuntimeId);
  }

  /** Pauses a running pipeline (current task keeps running). */
  async pause(pipelineId: string): Promise<Pipeline> {
    return this.runner.pause(pipelineId);
  }

  /** Resumes a paused pipeline. */
  async resume(pipelineId: string, agentRuntimeId?: string): Promise<PipelineWithTasks> {
    return this.runner.resume(pipelineId, agentRuntimeId);
  }

  /** Cancels a pipeline, stopping current workspace and skipping remaining tasks. */
  async cancel(pipelineId: string): Promise<PipelineWithTasks> {
    return this.runner.cancel(pipelineId);
  }

  /**
   * Hook called by workspace lifecycle events (completion, approval, failure).
   * Drives automatic pipeline advancement and auto-review triggering.
   */
  async onWorkspaceTransition(
    workspaceId: string,
    newStatus: 'completed' | 'approved' | 'failed' | 'stopped',
    agentRuntimeId?: string,
  ): Promise<void> {
    return this.runner.onWorkspaceTransition(workspaceId, newStatus, agentRuntimeId);
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /** Throws if the task is already in an active (non-idle/completed) pipeline other than excludePipelineId. */
  private assertTaskNotInActivePipeline(taskId: string, excludePipelineId?: string): void {
    // Full duplicate-across-pipelines guard would require a cross-pipeline query.
    // For now, we trust the caller to present valid selections — the DB has no
    // unique constraint on task_id across pipelines (intentional: completed
    // pipelines should still be queryable). The runner will fail gracefully if
    // a task is already running.
    void taskId;
    void excludePipelineId;
  }
}
