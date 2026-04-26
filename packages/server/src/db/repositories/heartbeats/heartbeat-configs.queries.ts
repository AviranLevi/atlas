// External
import { eq } from 'drizzle-orm';

// Shared
import type { CreateHeartbeatConfig, HeartbeatConfig, UpdateHeartbeatConfig } from '@atlas/shared';

// DB
import type { DB } from '../../index.js';
import { heartbeatConfigs, heartbeatRuns } from '../../schema/index.js';

// Lib
import { AppError, NotFoundError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';

// Local
import { mapConfig } from './heartbeats.mappers.js';

const FILE_PATH = 'db/repositories/heartbeats/heartbeat-configs.queries.ts';

export function findAllConfigs(db: DB): HeartbeatConfig[] {
  const FUNCTION_NAME = 'findAllConfigs';
  try {
    const rows = db.select().from(heartbeatConfigs).all();
    return rows.map((r) => mapConfig(r));
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query heartbeat configs', { cause: error });
  }
}

export function findEnabledConfigs(db: DB): HeartbeatConfig[] {
  const FUNCTION_NAME = 'findEnabledConfigs';
  try {
    const rows = db.select().from(heartbeatConfigs).where(eq(heartbeatConfigs.enabled, true)).all();
    return rows.map((r) => mapConfig(r));
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query enabled heartbeat configs', { cause: error });
  }
}

export function findConfigsByAgentId(db: DB, agentId: string): HeartbeatConfig[] {
  const FUNCTION_NAME = 'findConfigsByAgentId';
  try {
    const rows = db.select().from(heartbeatConfigs).where(eq(heartbeatConfigs.agentId, agentId)).all();
    return rows.map((r) => mapConfig(r));
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query heartbeat configs by agent', { cause: error });
  }
}

export function findConfigById(db: DB, id: string): HeartbeatConfig | null {
  const FUNCTION_NAME = 'findConfigById';
  try {
    const row = db.select().from(heartbeatConfigs).where(eq(heartbeatConfigs.id, id)).get();
    return row ? mapConfig(row) : null;
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query heartbeat config', { cause: error });
  }
}

export function insertConfig(db: DB, data: CreateHeartbeatConfig): HeartbeatConfig {
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
    const row = db.insert(heartbeatConfigs).values(values).returning().get();
    return mapConfig(row);
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to insert heartbeat config', { cause: error });
  }
}

export function updateConfig(db: DB, id: string, data: UpdateHeartbeatConfig): HeartbeatConfig {
  const FUNCTION_NAME = 'updateConfig';
  try {
    const row = db
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

export function removeConfig(db: DB, id: string): void {
  const FUNCTION_NAME = 'removeConfig';
  try {
    db.delete(heartbeatRuns).where(eq(heartbeatRuns.configId, id)).run();
    db.delete(heartbeatConfigs).where(eq(heartbeatConfigs.id, id)).run();
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to delete heartbeat config', { cause: error });
  }
}
