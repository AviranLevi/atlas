import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';

export const agents = sqliteTable('agents', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  name: text('name').notNull(),
  description: text('description'),
  personality: text('personality'),
  unbreakableRules: text('unbreakable_rules'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
