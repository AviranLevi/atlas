// External
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';
import { agents } from './agents.schema.js';
import { tasks } from './tasks.schema.js';

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id),
  reviewerId: text('reviewer_id').references(() => agents.id),
  reviewerType: text('reviewer_type').notNull().default('human'), // 'human' | 'agent'
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'changes_requested'
  checklist: text('checklist'), // JSON: [{item: string, checked: boolean}]
  notes: text('notes'),
  decidedAt: text('decided_at'),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});
