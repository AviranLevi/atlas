// External
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';
import { agents } from './agents.schema.js';
import { phases } from './phases.schema.js';
import { projects } from './projects.schema.js';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  name: text('name').notNull(),
  status: text('status').$defaultFn(() => 'To Do'),
  priority: text('priority'),
  estimate: text('estimate'),
  definitionOfDone: text('definition_of_done'),
  notes: text('notes'),
  projectId: text('project_id').references(() => projects.id),
  agentId: text('agent_id').references(() => agents.id),
  phaseId: text('phase_id').references(() => phases.id),
  source: text('source'),
  tags: text('tags'),
  workflowEnabled: integer('workflow_enabled', { mode: 'boolean' }).notNull().default(false),
  workflowStage: text('workflow_stage'),
  workflowProviderId: text('workflow_provider_id'),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});
