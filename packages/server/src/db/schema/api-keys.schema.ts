// External
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { uuidDefault, timestampDefault } from '../helpers/index.js';

export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  name: text('name').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  lastUsedAt: text('last_used_at'),
});
