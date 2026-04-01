// External
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';

export const usageLogs = sqliteTable('usage_logs', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  workspaceId: text('workspace_id'),
  conversationId: text('conversation_id'),
  agentId: text('agent_id'),
  taskId: text('task_id'),
  projectId: text('project_id'),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  totalTokens: integer('total_tokens').notNull().default(0),
  model: text('model'),
  providerType: text('provider_type'),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
});
