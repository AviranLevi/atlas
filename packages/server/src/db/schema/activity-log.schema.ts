import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';

export const activityLog = sqliteTable('activity_log', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  projectId: text('project_id'),
  agentId: text('agent_id'),
  taskId: text('task_id'),
  workspaceId: text('workspace_id'),
  eventType: text('event_type').notNull(),
  description: text('description').notNull(),
  metadata: text('metadata'), // JSON
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
