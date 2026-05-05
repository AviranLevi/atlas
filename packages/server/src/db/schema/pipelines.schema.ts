// External
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';
import { projects } from './projects.schema.js';
import { tasks } from './tasks.schema.js';
import { workspaces } from './workspaces.schema.js';

export const pipelines = sqliteTable('pipelines', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  status: text('status').notNull().default('idle'),
  currentTaskId: text('current_task_id'),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});

export const pipelineTasks = sqliteTable('pipeline_tasks', {
  pipelineId: text('pipeline_id')
    .notNull()
    .references(() => pipelines.id, { onDelete: 'cascade' }),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  autoReview: integer('auto_review', { mode: 'boolean' }).notNull().default(false),
  autoAccept: integer('auto_accept', { mode: 'boolean' }).notNull().default(false),
  baseStrategy: text('base_strategy').notNull().default('previous'),
  status: text('status').notNull().default('queued'),
  workspaceId: text('workspace_id').references(() => workspaces.id, { onDelete: 'set null' }),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
});
