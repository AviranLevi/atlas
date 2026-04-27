// External
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';
import { agents } from './agents.schema.js';
import { projects } from './projects.schema.js';

export const memory = sqliteTable('memory', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  name: text('name'),
  content: text('content').notNull(),
  type: text('type'),
  scope: text('scope').$defaultFn(() => 'project'),
  lastUsed: text('last_used'),
  status: text('status')
    .notNull()
    .$defaultFn(() => 'active'),
  // FK enforced via apply-fk-cascade-policy.ts (self-ref ON DELETE SET NULL);
  // drizzle can't express self-references without TS circular type errors.
  // If a future drizzle-kit generate proposes dropping this column, that's
  // the SQL-only FK going missing — preserve it.
  supersededBy: text('superseded_by'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').references(() => agents.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});
