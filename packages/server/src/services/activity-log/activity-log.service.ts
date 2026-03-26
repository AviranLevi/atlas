// Repositories
import { activityLogRepository } from '../../db/repositories/index.js';
import type { ActivityLogEntry } from '../../db/repositories/activity-log.repository.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/activity-log/activity-log.service.ts';

export class ActivityLogService {
  constructor(private readonly repo = activityLogRepository) {}

  /** Inserts an activity log entry. */
  log(event: {
    projectId?: string | null;
    agentId?: string | null;
    taskId?: string | null;
    workspaceId?: string | null;
    eventType: string;
    description: string;
    metadata?: Record<string, unknown> | null;
  }): void {
    const FUNCTION_NAME = 'log';
    try {
      this.repo.insert(event);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to log activity', { cause: error });
    }
  }

  /** Returns activity logs for a project, newest first. */
  listByProject(projectId: string, limit = 50): ActivityLogEntry[] {
    const FUNCTION_NAME = 'listByProject';
    try {
      return this.repo.findByProjectId(projectId, limit);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list activity log by project', { cause: error });
    }
  }

  /** Returns all activity logs across projects, newest first. */
  listGlobal(limit = 50): ActivityLogEntry[] {
    const FUNCTION_NAME = 'listGlobal';
    try {
      return this.repo.findAll(limit);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to list global activity log', { cause: error });
    }
  }
}
