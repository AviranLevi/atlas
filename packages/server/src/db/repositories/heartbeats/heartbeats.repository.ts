// Shared
import type { CreateHeartbeatConfig, HeartbeatConfig, HeartbeatRun, UpdateHeartbeatConfig } from '@atlas/shared';

// DB
import type { DB } from '../../index.js';

// Lib
import { NotFoundError } from '../../../lib/errors.js';

// Local
import * as configsQ from './heartbeat-configs.queries.js';
import * as runsQ from './heartbeat-runs.queries.js';

export class HeartbeatsRepository {
  constructor(private readonly db: DB) {}

  /** Returns all heartbeat configs. */
  findAllConfigs(): HeartbeatConfig[] {
    return configsQ.findAllConfigs(this.db);
  }

  /** Returns enabled heartbeat configs. */
  findEnabledConfigs(): HeartbeatConfig[] {
    return configsQ.findEnabledConfigs(this.db);
  }

  /** Returns heartbeat configs for an agent. */
  findConfigsByAgentId(agentId: string): HeartbeatConfig[] {
    return configsQ.findConfigsByAgentId(this.db, agentId);
  }

  /** Returns a heartbeat config by ID, or null. */
  findConfigById(id: string): HeartbeatConfig | null {
    return configsQ.findConfigById(this.db, id);
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
    return configsQ.insertConfig(this.db, data);
  }

  /** Updates a heartbeat config and returns the updated record. */
  updateConfig(id: string, data: UpdateHeartbeatConfig): HeartbeatConfig {
    return configsQ.updateConfig(this.db, id, data);
  }

  /** Deletes a heartbeat config by ID and its runs. */
  removeConfig(id: string): void {
    configsQ.removeConfig(this.db, id);
  }

  /** Inserts a heartbeat run and returns the created record. */
  insertRun(data: {
    configId: string;
    agentId: string;
    workspaceId?: string | null;
    status: string;
    result?: string | null;
  }): HeartbeatRun {
    return runsQ.insertRun(this.db, data);
  }

  /** Updates a heartbeat run and returns the updated record. */
  updateRun(
    id: string,
    data: { status?: string; result?: string | null; workspaceId?: string | null; completedAt?: string | null },
  ): HeartbeatRun {
    return runsQ.updateRun(this.db, id, data);
  }

  /** Returns recent runs for a config, newest first. */
  findRunsByConfigId(configId: string, limit: number): HeartbeatRun[] {
    return runsQ.findRunsByConfigId(this.db, configId, limit);
  }

  /** Returns recent runs for an agent, newest first. */
  findRunsByAgentId(agentId: string, limit: number): HeartbeatRun[] {
    return runsQ.findRunsByAgentId(this.db, agentId, limit);
  }

  /** Counts runs today (UTC) for this config with result task_started. */
  countTodaysRuns(configId: string): number {
    return runsQ.countTodaysRuns(this.db, configId);
  }
}
