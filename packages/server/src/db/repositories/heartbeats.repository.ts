// External
import { and, desc, eq, gte, sql } from 'drizzle-orm';

// Shared
import type {
  CreateHeartbeatConfig,
  HeartbeatConfig,
  HeartbeatRun,
  UpdateHeartbeatConfig,
} from '@atlas/shared';

// DB
import type { DB } from '../index.js';
import { heartbeatConfigs, heartbeatRuns } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';

const FILE_PATH = 'db/repositories/heartbeats.repository.ts';

function mapConfig(row: typeof heartbeatConfigs.$inferSelect): HeartbeatConfig {
  return {
    id: row.id,
    agentId: row.agentId,
    projectId: row.projectId ?? null,
    runtime: row.runtime,
    cronExpression: row.cronExpression,
    enabled: row.enabled,
    maxConcurrent: row.maxConcurrent,
    maxRunsPerDay: row.maxRunsPerDay,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapRun(row: typeof heartbeatRuns.$inferSelect): HeartbeatRun {
  return {
    id: row.id,
    configId: row.configId,
    agentId: row.agentId,
    workspaceId: row.workspaceId ?? null,
    status: row.status as HeartbeatRun['status'],
    result: (row.result as HeartbeatRun['result']) ?? null,
    triggeredAt: row.triggeredAt,
    completedAt: row.completedAt ?? null,
  };
}

export class HeartbeatsRepository {
  constructor(private readonly db: DB) {}

  /** Returns all heartbeat configs. */
  findAllConfigs(): HeartbeatConfig[] {
    const FUNCTION_NAME = 'findAllConfigs';
    try {
      const rows = this.db.select().from(heartbeatConfigs).all();
      return rows.map((r) => mapConfig(r));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query heartbeat configs', { cause: error });
    }
  }

  /** Returns enabled heartbeat configs. */
  findEnabledConfigs(): HeartbeatConfig[] {
    const FUNCTION_NAME = 'findEnabledConfigs';
    try {
      const rows = this.db
        .select()
        .from(heartbeatConfigs)
        .where(eq(heartbeatConfigs.enabled, true))
        .all();
      return rows.map((r) => mapConfig(r));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query enabled heartbeat configs', { cause: error });
    }
  }

  /** Returns heartbeat configs for an agent. */
  findConfigsByAgentId(agentId: string): HeartbeatConfig[] {
    const FUNCTION_NAME = 'findConfigsByAgentId';
    try {
      const rows = this.db
        .select()
        .from(heartbeatConfigs)
        .where(eq(heartbeatConfigs.agentId, agentId))
        .all();
      return rows.map((r) => mapConfig(r));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query heartbeat configs by agent', { cause: error });
    }
  }

  /** Returns a heartbeat config by ID, or null. */
  findConfigById(id: string): HeartbeatConfig | null {
    const FUNCTION_NAME = 'findConfigById';
    try {
      const row = this.db.select().from(heartbeatConfigs).where(eq(heartbeatConfigs.id, id)).get();
      return row ? mapConfig(row) : null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query heartbeat config', { cause: error });
    }
  }

  /** Returns a heartbeat config by ID, or throws NotFoundError. */
  findConfigByIdOrThrow(id: string): HeartbeatConfig {
    const row = this.findConfigById(id);
    if (!row) {
      throw new NotFoundError('HeartbeatConfig', id);
    }
    return row;
  }

  /** Inserts a heartbeat config and returns the created record. */
  insertConfig(data: CreateHeartbeatConfig): HeartbeatConfig {
    const FUNCTION_NAME = 'insertConfig';
    try {
      const values = {
        agentId: data.agentId,
        projectId: data.projectId ?? null,
        runtime: data.runtime,
        cronExpression: data.cronExpression,
        enabled: data.enabled ?? false,
        maxConcurrent: data.maxConcurrent ?? 1,
        maxRunsPerDay: data.maxRunsPerDay ?? 5,
      };
      const row = this.db.insert(heartbeatConfigs).values(values).returning().get();
      return mapConfig(row);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert heartbeat config', { cause: error });
    }
  }

  /** Updates a heartbeat config and returns the updated record. */
  updateConfig(id: string, data: UpdateHeartbeatConfig): HeartbeatConfig {
    const FUNCTION_NAME = 'updateConfig';
    try {
      const row = this.db
        .update(heartbeatConfigs)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(heartbeatConfigs.id, id))
        .returning()
        .get();
      if (!row) {
        throw new NotFoundError('HeartbeatConfig', id);
      }
      return mapConfig(row);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) throw error;
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update heartbeat config', { cause: error });
    }
  }

  /** Deletes a heartbeat config by ID and its runs. */
  removeConfig(id: string): void {
    const FUNCTION_NAME = 'removeConfig';
    try {
      this.db.delete(heartbeatRuns).where(eq(heartbeatRuns.configId, id)).run();
      this.db.delete(heartbeatConfigs).where(eq(heartbeatConfigs.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete heartbeat config', { cause: error });
    }
  }

  /** Inserts a heartbeat run and returns the created record. */
  insertRun(data: {
    configId: string;
    agentId: string;
    workspaceId?: string | null;
    status: string;
    result?: string | null;
  }): HeartbeatRun {
    const FUNCTION_NAME = 'insertRun';
    try {
      const row = this.db
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

  /** Updates a heartbeat run and returns the updated record. */
  updateRun(
    id: string,
    data: { status?: string; result?: string | null; workspaceId?: string | null; completedAt?: string | null },
  ): HeartbeatRun {
    const FUNCTION_NAME = 'updateRun';
    try {
      const row = this.db
        .update(heartbeatRuns)
        .set(data)
        .where(eq(heartbeatRuns.id, id))
        .returning()
        .get();
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

  /** Returns recent runs for a config, newest first. */
  findRunsByConfigId(configId: string, limit: number): HeartbeatRun[] {
    const FUNCTION_NAME = 'findRunsByConfigId';
    try {
      const rows = this.db
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

  /** Returns recent runs for an agent, newest first. */
  findRunsByAgentId(agentId: string, limit: number): HeartbeatRun[] {
    const FUNCTION_NAME = 'findRunsByAgentId';
    try {
      const rows = this.db
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

  /** Counts runs today (UTC) for this config with result task_started. */
  countTodaysRuns(configId: string): number {
    const FUNCTION_NAME = 'countTodaysRuns';
    try {
      const start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const startIso = start.toISOString();
      const row = this.db
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
}
