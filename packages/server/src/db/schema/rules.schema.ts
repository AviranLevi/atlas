import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';

export const rules = sqliteTable('resources', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  name: text('name').notNull(),
  type: text('type'),
  tags: text('tags'),
  content: text('content'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
