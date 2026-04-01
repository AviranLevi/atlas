// External
import { desc, eq } from 'drizzle-orm';

// DB
import type { DB } from '../index.js';
import { activityLog } from '../schema/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'db/repositories/activity-log.repository.ts';

export interface ActivityLogEntry {
  id: string;
  projectId: string | null;
  agentId: string | null;
  taskId: string | null;
  workspaceId: string | null;
  eventType: string;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

type ActivityLogRow = Omit<ActivityLogEntry, 'metadata'> & { metadata: string | null };

function parseEntry(row: ActivityLogRow): ActivityLogEntry {
  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

export class ActivityLogRepository {
  constructor(private readonly db: DB) {}

  /** Inserts an activity log entry. Best-effort — does not throw on failure. */
  insert(data: {
    projectId?: string | null;
    agentId?: string | null;
    taskId?: string | null;
    workspaceId?: string | null;
    eventType: string;
    description: string;
    metadata?: Record<string, unknown> | null;
  }): void {
    const FUNCTION_NAME = 'insert';
    try {
      this.db
        .insert(activityLog)
        .values({
          projectId: data.projectId ?? null,
          agentId: data.agentId ?? null,
          taskId: data.taskId ?? null,
          workspaceId: data.workspaceId ?? null,
          eventType: data.eventType,
          description: data.description,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        })
        .run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      // Don't throw — activity logging is best-effort
    }
  }

  /** Queries activity logs for a project, ordered by creation date. */
  findByProjectId(projectId: string, limit = 50): ActivityLogEntry[] {
    const FUNCTION_NAME = 'findByProjectId';
    try {
      const rows = this.db
        .select()
        .from(activityLog)
        .where(eq(activityLog.projectId, projectId))
        .orderBy(desc(activityLog.createdAt))
        .limit(limit)
        .all();
      return rows.map((r) => parseEntry(r as ActivityLogRow));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query activity log', { cause: error });
    }
  }

  /** Queries all activity logs, ordered by creation date. */
  findAll(limit = 50): ActivityLogEntry[] {
    const FUNCTION_NAME = 'findAll';
    try {
      const rows = this.db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit).all();
      return rows.map((r) => parseEntry(r as ActivityLogRow));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query activity log', { cause: error });
    }
  }
}
