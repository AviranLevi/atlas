import { activityLogRepository } from '../db/repositories/index.js';
import type { ActivityLogEntry } from '../db/repositories/activity-log.repository.js';

const FILE_PATH = 'services/activity-log.service.ts';

export class ActivityLogService {
  constructor(private readonly repo = activityLogRepository) {}

  log(event: {
    projectId?: string | null;
    agentId?: string | null;
    taskId?: string | null;
    workspaceId?: string | null;
    eventType: string;
    description: string;
    metadata?: Record<string, unknown> | null;
  }): void {
    this.repo.insert(event);
  }

  listByProject(projectId: string, limit = 50): ActivityLogEntry[] {
    return this.repo.findByProjectId(projectId, limit);
  }

  listGlobal(limit = 50): ActivityLogEntry[] {
    return this.repo.findAll(limit);
  }
}
