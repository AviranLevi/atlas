// Shared
import type { CreateTask, Task, UpdateTask } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Services
import { activityLogService, settingsService } from '../index.js';

// Repositories
import { reviewsRepository, tasksRepository, workspacesRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

/** Statuses that mean "an agent should not be running for this task". */
const INACTIVE_STATUSES: ReadonlySet<string> = new Set([
  TASK_STATUS.BACKLOG,
  TASK_STATUS.TODO,
  TASK_STATUS.DONE,
  TASK_STATUS.BLOCKED,
]);

const FILE_PATH = 'services/tasks/tasks.service.ts';

export class TasksService {
  constructor(private readonly repo = tasksRepository) {}

  /** Lists tasks, optionally filtered by status, projectId, or agentId. */
  async list(filters?: { status?: string; projectId?: string; agentId?: string }): Promise<Task[]> {
    const FUNCTION_NAME = 'list';
    try {
      if (filters && (filters.status || filters.projectId || filters.agentId)) {
        return this.repo.findByFilters(filters);
      }
      return this.repo.findAll();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list tasks', { cause: error });
    }
  }

  /** Returns a task by ID. */
  async getById(id: string): Promise<Task> {
    const FUNCTION_NAME = 'getById';
    try {
      return this.repo.findByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get task', { cause: error });
    }
  }

  /** Creates a new task, auto-assigns via dispatch rules if needed, and logs the event. */
  async create(data: CreateTask): Promise<Task> {
    const FUNCTION_NAME = 'create';
    try {
      let autoStart = false;
      if (!data.agentId) {
        const dispatch = await settingsService.resolveDispatchRule(data.name);
        if (dispatch) {
          data.agentId = dispatch.agentId;
          data.source = 'dispatch';
          autoStart = dispatch.autoStart;
        }
      }
      const task = this.repo.insert(data);
      activityLogService.log({
        projectId: task.projectId,
        taskId: task.id,
        eventType: 'task_created',
        description: `Task created: ${task.name}`,
        metadata: { status: task.status },
      });
      if (autoStart) {
        import('../orchestrator/orchestrator.service.js').then(async ({ OrchestratorService }) => {
          try {
            const { executorRegistry } = await import('../../executors/index.js');
            const installed = await executorRegistry.listInstalled();
            if (installed.length > 0) {
              const orchestrator = new OrchestratorService();
              await orchestrator.startWork(task.id, installed[0].id);
            }
          } catch (err) {
            logger.error(`${FILE_PATH} :: auto-start workspace via dispatch rule`, err);
          }
        });
      }
      return task;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create task', { cause: error });
    }
  }

  /** Updates a task by ID and handles status-change side effects. */
  async update(id: string, data: UpdateTask): Promise<Task> {
    const FUNCTION_NAME = 'update';
    try {
      const previous = this.repo.findById(id);
      const task = this.repo.update(id, data);
      if (previous && data.status && data.status !== previous.status) {
        activityLogService.log({
          projectId: task.projectId,
          taskId: task.id,
          eventType: 'task_status_changed',
          description: `Task "${task.name}" moved from ${previous.status} to ${data.status}`,
          metadata: { from: previous.status, to: data.status },
        });
        // Auto-create review when task enters "In Review"
        if (data.status === TASK_STATUS.IN_REVIEW) {
          // Lazy import to avoid circular dependency at module init time
          import('../reviews/reviews.service.js').then(({ ReviewsService }) => {
            const reviewsService = new ReviewsService();
            reviewsService.createForTask(id).catch((err) => {
              logger.error(`${FILE_PATH} :: auto-create review`, err);
            });
          });
        }

        // Auto-stop any running agent when the task is moved to an inactive status.
        // This prevents orphaned agent processes when the user drags a card back to
        // "To Do" (or marks it Done / Blocked) while an agent is still running.
        if (INACTIVE_STATUSES.has(data.status)) {
          const activeWorkspace = workspacesRepository.findByTaskId(id);
          if (activeWorkspace && (activeWorkspace.status === 'running' || activeWorkspace.status === 'pending')) {
            // Lazy import to break the potential circular dep with orchestrator
            import('../orchestrator/orchestrator.service.js').then(({ OrchestratorService }) => {
              const orchestrator = new OrchestratorService();
              // Pass resetTaskStatus=false — we're already handling the task status here
              orchestrator.stopWork(activeWorkspace.id, false).catch((err) => {
                logger.error(`${FILE_PATH} :: auto-stop workspace on status rollback`, err);
              });
            });
          }
        }
      }
      return task;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update task', { cause: error });
    }
  }

  /** Deletes a task and all its related workspaces and reviews. */
  async delete(id: string): Promise<void> {
    const FUNCTION_NAME = 'delete';
    try {
      // Remove related records first (FK constraints)
      workspacesRepository.removeByTaskId(id);
      reviewsRepository.removeByTaskId(id);
      this.repo.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete task', { cause: error });
    }
  }
}
