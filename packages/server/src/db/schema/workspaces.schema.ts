import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
// DB
import { uuidDefault, timestampDefault } from '../helpers/index.js';
import { tasks } from './tasks.schema.js';
import { projects } from './projects.schema.js';
import { agents } from './agents.schema.js';

export const workspaces = sqliteTable('workspaces', {
  id: text('id')
    .primaryKey()
    .$defaultFn(uuidDefault),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  agentId: text('agent_id')
    .references(() => agents.id),
  agentRuntime: text('agent_runtime').notNull(),
  branchName: text('branch_name').notNull(),
  worktreePath: text('worktree_path').notNull(),
  pid: integer('pid'),
  status: text('status').notNull().default('pending'),
  output: text('output'),
  diffComments: text('diff_comments'), // JSON: [{id, filename, lineNumber, lineContent, body, createdAt}]
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(timestampDefault),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(timestampDefault),
});
