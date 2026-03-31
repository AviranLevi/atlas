import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';
import { agents } from './agents.schema.js';
import { projects } from './projects.schema.js';

export const heartbeatConfigs = sqliteTable('heartbeat_configs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  agentId: text('agent_id')
    .notNull()
    .references(() => agents.id),
  projectId: text('project_id').references(() => projects.id),
  runtime: text('runtime').notNull(),
  cronExpression: text('cron_expression').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(false),
  maxConcurrent: integer('max_concurrent').notNull().default(1),
  maxRunsPerDay: integer('max_runs_per_day').notNull().default(5),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});

export const heartbeatRuns = sqliteTable('heartbeat_runs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  configId: text('config_id')
    .notNull()
    .references(() => heartbeatConfigs.id),
  agentId: text('agent_id').notNull(),
  workspaceId: text('workspace_id'),
  status: text('status').notNull(),
  result: text('result'),
  triggeredAt: text('triggered_at')
    .notNull()
    .$defaultFn(timestampDefault),
  completedAt: text('completed_at'),
});
