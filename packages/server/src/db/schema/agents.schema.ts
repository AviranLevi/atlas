// External
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';
import { agentProviders } from './agent-providers.schema.js';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  name: text('name').notNull(),
  description: text('description'),
  personality: text('personality'),
  unbreakableRules: text('unbreakable_rules'),
  providerId: text('provider_id').references(() => agentProviders.id, { onDelete: 'set null' }),
  defaultModel: text('default_model'),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});
