// External
import cron, { type ScheduledTask } from 'node-cron';

// Shared
import type { CreateHeartbeatConfig, HeartbeatConfig, HeartbeatRun, Task, UpdateHeartbeatConfig } from '@atlas/shared';
import { TASK_STATUS } from '@atlas/shared';

// Repositories
import { heartbeatsRepository, workspacesRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/heartbeat/heartbeat.service.ts';

const PRIORITY_RANK: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function taskPickRank(task: Task): number {
  if (!task.priority) return 0;
  return PRIORITY_RANK[task.priority] ?? 0;
}

function pickNextTodoTask(tasks: Task[]): Task | undefined {
  const sorted = [...tasks].sort((a, b) => {
    const pr = taskPickRank(b) - taskPickRank(a);
    if (pr !== 0) return pr;
    return a.createdAt.localeCompare(b.createdAt);
  });
  return sorted[0];
}

function countActiveWorkspacesForAgent(agentId: string): number {
  const running = workspacesRepository.findByStatus('running').filter((w) => w.agentId === agentId).length;
  const pending = workspacesRepository.findByStatus('pending').filter((w) => w.agentId === agentId).length;
  return running + pending;
}

export class HeartbeatService {
  private schedules = new Map<string, ScheduledTask>();

  constructor(private readonly repo = heartbeatsRepository) {}

  /** Lists heartbeat configs, optionally filtered by agent. */
  async listConfigs(agentId?: string): Promise<HeartbeatConfig[]> {
    const FUNCTION_NAME = 'listConfigs';
    try {
      if (agentId) {
        return this.repo.findConfigsByAgentId(agentId);
      }
      return this.repo.findAllConfigs();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list heartbeat configs', { cause: error });
    }
  }

  /** Returns a heartbeat config by ID. */
  async getConfigById(id: string): Promise<HeartbeatConfig> {
    const FUNCTION_NAME = 'getConfigById';
    try {
      return this.repo.findConfigByIdOrThrow(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to get heartbeat config', { cause: error });
    }
  }

  /** Creates a heartbeat config. */
  async createConfig(data: CreateHeartbeatConfig): Promise<HeartbeatConfig> {
    const FUNCTION_NAME = 'createConfig';
    try {
      return this.repo.insertConfig(data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to create heartbeat config', { cause: error });
    }
  }

  /** Updates a heartbeat config by ID. */
  async updateConfig(id: string, data: UpdateHeartbeatConfig): Promise<HeartbeatConfig> {
    const FUNCTION_NAME = 'updateConfig';
    try {
      return this.repo.updateConfig(id, data);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update heartbeat config', { cause: error });
    }
  }

  /** Deletes a heartbeat config by ID. */
  async deleteConfig(id: string): Promise<void> {
    const FUNCTION_NAME = 'deleteConfig';
    try {
      this.repo.findConfigByIdOrThrow(id);
      this.repo.removeConfig(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete heartbeat config', { cause: error });
    }
  }

  /** Returns recent heartbeat runs for an agent. */
  async getRunHistory(agentId: string, limit = 50): Promise<HeartbeatRun[]> {
    const FUNCTION_NAME = 'getRunHistory';
    try {
      return this.repo.findRunsByAgentId(agentId, limit);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list heartbeat run history', { cause: error });
    }
  }

  /** Rebuilds cron schedules from enabled configs. */
  async refreshSchedules(): Promise<void> {
    const FUNCTION_NAME = 'refreshSchedules';
    try {
      for (const task of this.schedules.values()) {
        task.stop();
      }
      this.schedules.clear();
      const configs = this.repo.findEnabledConfigs();
      for (const config of configs) {
        if (!cron.validate(config.cronExpression)) {
          logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} invalid cron for config ${config.id}`);
          continue;
        }
        const task = cron.schedule(config.cronExpression, () => {
          void this.executeHeartbeat(config.id).catch((err) => {
            logger.error(`${FILE_PATH} :: executeHeartbeat`, err);
          });
        });
        this.schedules.set(config.id, task);
      }
      logger.info(`Heartbeat scheduler: ${this.schedules.size} schedules active`);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to refresh heartbeat schedules', { cause: error });
    }
  }

  /** Starts the heartbeat scheduler. */
  start(): void {
    logger.info('Heartbeat scheduler started');
    void this.refreshSchedules().catch((err) => {
      logger.error(`${FILE_PATH} :: start`, err);
    });
  }

  /** Stops all heartbeat cron jobs. */
  stop(): void {
    for (const task of this.schedules.values()) {
      task.stop();
    }
    this.schedules.clear();
  }

  /** Runs one heartbeat cycle immediately and returns the resulting run. */
  async triggerManual(configId: string): Promise<HeartbeatRun> {
    const FUNCTION_NAME = 'triggerManual';
    try {
      const config = this.repo.findConfigByIdOrThrow(configId);
      if (!config.enabled) {
        throw new AppError('Heartbeat config is disabled', { status: 400 });
      }
      const run = await this.executeHeartbeat(configId);
      if (!run) {
        throw new AppError('Heartbeat did not produce a run', { status: 500 });
      }
      return run;
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to trigger heartbeat', { cause: error });
    }
  }

  private async executeHeartbeat(configId: string): Promise<HeartbeatRun | null> {
    const config = this.repo.findConfigById(configId);
    if (!config) {
      logger.warn(`${FILE_PATH} :: executeHeartbeat missing config ${configId}`);
      return null;
    }
    if (!config.enabled) {
      return null;
    }

    const { tasksService, activityLogService, orchestratorService } = await import('../index.js');

    const todaysRuns = this.repo.countTodaysRuns(configId);
    if (todaysRuns >= config.maxRunsPerDay) {
      const run = this.repo.insertRun({
        configId: config.id,
        agentId: config.agentId,
        status: 'skipped',
        result: 'daily_limit_reached',
      });
      activityLogService.log({
        agentId: config.agentId,
        projectId: config.projectId,
        eventType: 'heartbeat_skipped',
        description: 'Heartbeat skipped: daily limit reached',
      });
      return run;
    }

    const activeWs = countActiveWorkspacesForAgent(config.agentId);
    if (activeWs >= config.maxConcurrent) {
      return this.repo.insertRun({
        configId: config.id,
        agentId: config.agentId,
        status: 'skipped',
        result: 'already_running',
      });
    }

    const todoTasks = await tasksService.list({
      agentId: config.agentId,
      status: TASK_STATUS.TODO,
    });
    const scoped = config.projectId ? todoTasks.filter((t) => t.projectId === config.projectId) : todoTasks;
    const task = pickNextTodoTask(scoped);

    if (!task) {
      return this.repo.insertRun({
        configId: config.id,
        agentId: config.agentId,
        status: 'completed',
        result: 'no_work',
      });
    }

    const run = this.repo.insertRun({
      configId: config.id,
      agentId: config.agentId,
      status: 'working',
      result: 'task_started',
    });

    try {
      const workspace = await orchestratorService.startWork(task.id, config.runtime);
      const updated = this.repo.updateRun(run.id, { workspaceId: workspace.id });
      activityLogService.log({
        agentId: config.agentId,
        taskId: task.id,
        workspaceId: workspace.id,
        projectId: task.projectId,
        eventType: 'heartbeat_started',
        description: `Heartbeat started task "${task.name}" for agent`,
      });
      return updated;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: executeHeartbeat startWork`, error);
      this.repo.updateRun(run.id, {
        status: 'failed',
        result: null,
        completedAt: new Date().toISOString(),
      });
      throw error;
    }
  }
}
