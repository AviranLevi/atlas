// External
import { and, desc, eq, gte, sql } from 'drizzle-orm';

// Shared
import type { HeartbeatRun } from '@atlas/shared';

// DB
import type { DB } from '../../index.js';
import { heartbeatRuns } from '../../schema/index.js';

// Lib
import { AppError, NotFoundError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';

// Local
import { mapRun } from './heartbeats.mappers.js';

const FILE_PATH = 'db/repositories/heartbeats/heartbeat-runs.queries.ts';

export function insertRun(
  db: DB,
  data: {
    configId: string;
    agentId: string;
    workspaceId?: string | null;
    status: string;
    result?: string | null;
  },
): HeartbeatRun {
  const FUNCTION_NAME = 'insertRun';
  try {
    const row = db
      .insert(heartbeatRuns)
      .values({
        configId: data.configId,
        agentId: data.agentId,
        workspaceId: data.workspaceId ?? null,
        status: data.status,
        result: data.result ?? null,
      })
      .returning()
      .get();
    return mapRun(row);
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to insert heartbeat run', { cause: error });
  }
}

export function updateRun(
  db: DB,
  id: string,
  data: { status?: string; result?: string | null; workspaceId?: string | null; completedAt?: string | null },
): HeartbeatRun {
  const FUNCTION_NAME = 'updateRun';
  try {
    const row = db.update(heartbeatRuns).set(data).where(eq(heartbeatRuns.id, id)).returning().get();
    if (!row) {
      throw new NotFoundError('HeartbeatRun', id);
    }
    return mapRun(row);
  } catch (error: unknown) {
    if (error instanceof NotFoundError) throw error;
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to update heartbeat run', { cause: error });
  }
}

export function findRunsByConfigId(db: DB, configId: string, limit: number): HeartbeatRun[] {
  const FUNCTION_NAME = 'findRunsByConfigId';
  try {
    const rows = db
      .select()
      .from(heartbeatRuns)
      .where(eq(heartbeatRuns.configId, configId))
      .orderBy(desc(heartbeatRuns.triggeredAt))
      .limit(limit)
      .all();
    return rows.map((r) => mapRun(r));
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query heartbeat runs by config', { cause: error });
  }
}

export function findRunsByAgentId(db: DB, agentId: string, limit: number): HeartbeatRun[] {
  const FUNCTION_NAME = 'findRunsByAgentId';
  try {
    const rows = db
      .select()
      .from(heartbeatRuns)
      .where(eq(heartbeatRuns.agentId, agentId))
      .orderBy(desc(heartbeatRuns.triggeredAt))
      .limit(limit)
      .all();
    return rows.map((r) => mapRun(r));
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query heartbeat runs by agent', { cause: error });
  }
}

export function countTodaysRuns(db: DB, configId: string): number {
  const FUNCTION_NAME = 'countTodaysRuns';
  try {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const startIso = start.toISOString();
    const row = db
      .select({ c: sql<number>`count(*)` })
      .from(heartbeatRuns)
      .where(
        and(
          eq(heartbeatRuns.configId, configId),
          eq(heartbeatRuns.result, 'task_started'),
          gte(heartbeatRuns.triggeredAt, startIso),
        ),
      )
      .get();
    return Number(row?.c ?? 0);
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to count heartbeat runs', { cause: error });
  }
}
