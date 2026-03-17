import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';
import { projects } from './projects.schema.js';
import { agents } from './agents.schema.js';

export const memory = sqliteTable('memory', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  name: text('name'),
  content: text('content').notNull(),
  type: text('type'),
  scope: text('scope')
    .$defaultFn(() => 'project'),
  lastUsed: text('last_used'),
  projectId: text('project_id').references(() => projects.id),
  agentId: text('agent_id').references(() => agents.id),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
