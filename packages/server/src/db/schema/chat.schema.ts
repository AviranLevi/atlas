import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';
import { projects } from './projects.schema.js';
import { agentProviders } from './agent-providers.schema.js';

export const chatConversations = sqliteTable('chat_conversations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  title: text('title'),
  projectId: text('project_id').references(() => projects.id),
  providerId: text('provider_id')
    .notNull()
    .references(() => agentProviders.id),
  model: text('model').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => chatConversations.id),
  role: text('role').notNull(),
  content: text('content')
    .notNull()
    .$defaultFn(() => ''),
  toolCalls: text('tool_calls'),
  toolResults: text('tool_results'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
