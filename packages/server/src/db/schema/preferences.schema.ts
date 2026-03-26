import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { timestampDefault } from '../helpers/index.js';

export const preferences = sqliteTable('preferences', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});
