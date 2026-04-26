// Shared
import type { HeartbeatConfig, HeartbeatRun } from '@atlas/shared';

// DB
import type { heartbeatConfigs, heartbeatRuns } from '../../schema/index.js';

export function mapConfig(row: typeof heartbeatConfigs.$inferSelect): HeartbeatConfig {
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

export function mapRun(row: typeof heartbeatRuns.$inferSelect): HeartbeatRun {
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
