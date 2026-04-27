// External
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';
import { projects } from './projects.schema.js';

export const phases = sqliteTable('phases', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  successCriteria: text('success_criteria'),
  status: text('status').notNull().default('planning'), // 'planning' | 'active' | 'review' | 'completed'
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});
