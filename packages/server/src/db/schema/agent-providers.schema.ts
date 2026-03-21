import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';

export const agentProviders = sqliteTable('agent_providers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'anthropic' | 'openai' | 'openai-compatible' | 'ollama'
  apiKey: text('api_key'),
  baseUrl: text('base_url'),
  modelName: text('model_name').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
