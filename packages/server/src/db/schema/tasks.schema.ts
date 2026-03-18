import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuidDefault, timestampDefault } from '../helpers/index.js';
import { projects } from './projects.schema.js';
import { agents } from './agents.schema.js';
import { skills } from './skills.schema.js';

export const tasks = sqliteTable('tasks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  name: text('name').notNull(),
  status: text('status')
    .$defaultFn(() => 'To Do'),
  priority: text('priority'),
  estimate: text('estimate'),
  definitionOfDone: text('definition_of_done'),
  notes: text('notes'),
  projectId: text('project_id').references(() => projects.id),
  agentId: text('agent_id').references(() => agents.id),
  skillId: text('skill_id').references(() => skills.id),
  tags: text('tags'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
