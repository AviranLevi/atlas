import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';
import { projects } from './projects.schema.js';

export const phases = sqliteTable('phases', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('planning'), // 'planning' | 'active' | 'review' | 'completed'
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
