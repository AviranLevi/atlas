import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';

export const projects = sqliteTable('projects', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  name: text('name').notNull(),
  description: text('description'),
  techStack: text('tech_stack'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
