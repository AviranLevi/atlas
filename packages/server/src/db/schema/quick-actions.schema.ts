// External
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';
import { agents } from './agents.schema.js';
import { projects } from './projects.schema.js';

export const quickActions = sqliteTable('quick_actions', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  name: text('name').notNull(),
  description: text('description'),
  agentId: text('agent_id').references(() => agents.id, { onDelete: 'set null' }),
  promptTemplate: text('prompt_template').notNull(),
  icon: text('icon'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});
