// External
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';
import { agentProviders } from './agent-providers.schema.js';
import { projects } from './projects.schema.js';

export const chatConversations = sqliteTable('chat_conversations', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  title: text('title'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  backendType: text('backend_type')
    .notNull()
    .$defaultFn(() => 'api'),
  providerId: text('provider_id').references(() => agentProviders.id, { onDelete: 'set null' }),
  executorId: text('executor_id'),
  model: text('model'),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => chatConversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content')
    .notNull()
    .$defaultFn(() => ''),
  toolCalls: text('tool_calls'),
  toolResults: text('tool_results'),
  attachments: text('attachments'),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
});
