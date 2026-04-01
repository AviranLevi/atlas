// External
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';
import { agents } from './agents.schema.js';
import { skills } from './skills.schema.js';

export const globalInstructions = sqliteTable('global_instructions', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  content: text('content').notNull(),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});

export const dispatchRules = sqliteTable('dispatch_rules', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  pattern: text('pattern').notNull(),
  agentId: text('agent_id').references(() => agents.id),
  skillId: text('skill_id').references(() => skills.id),
  autoStart: integer('auto_start', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});
