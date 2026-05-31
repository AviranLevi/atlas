// External
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault } from '../helpers/index.js';

export const modelCache = sqliteTable('model_cache', {
  providerType: text('provider_type').primaryKey().notNull(),
  models: text('models').notNull().default('[]'),
  fetchedAt: text('fetched_at').notNull().$defaultFn(timestampDefault),
});
