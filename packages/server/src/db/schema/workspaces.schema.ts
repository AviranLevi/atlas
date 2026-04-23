// External
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';
import { agents } from './agents.schema.js';
import { projects } from './projects.schema.js';
import { tasks } from './tasks.schema.js';

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  agentId: text('agent_id').references(() => agents.id),
  agentRuntime: text('agent_runtime').notNull(),
  model: text('model'),
  branchName: text('branch_name').notNull(),
  // Branch the worktree was based on (e.g. 'main', 'master', 'develop').
  // Nullable for rows created before this column existed; runtime falls back
  // to getDefaultBranch(project.localPath) when null.
  baseBranch: text('base_branch'),
  worktreePath: text('worktree_path').notNull(),
  pid: integer('pid'),
  status: text('status').notNull().default('pending'),
  output: text('output'),
  workflowStage: text('workflow_stage'),
  parentWorkspaceId: text('parent_workspace_id'), // FK enforced via migration, not ORM (self-ref causes TS circular type)
  // Set when a structured brainstorm/plan stage couldn't resolve an API
  // provider and silently fell back to CLI execution. Surfaced in the UI so
  // users understand why they got prose output instead of structured JSON.
  providerFallbackReason: text('provider_fallback_reason'),
  diffComments: text('diff_comments'), // JSON: [{id, filename, lineNumber, lineContent, body, createdAt}]
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  costUsd: real('cost_usd'),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});
