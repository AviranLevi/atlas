// External
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { uuidDefault } from '../helpers/index.js';
import { agents } from './agents.schema.js';
import { projects } from './projects.schema.js';
import { rules } from './rules.schema.js';
import { skills } from './skills.schema.js';

export const agentSkills = sqliteTable('agent_skills', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  agentId: text('agent_id')
    .notNull()
    .references(() => agents.id),
  skillId: text('skill_id')
    .notNull()
    .references(() => skills.id),
});

export const agentRules = sqliteTable('agent_resources', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  agentId: text('agent_id')
    .notNull()
    .references(() => agents.id),
  ruleId: text('resource_id')
    .notNull()
    .references(() => rules.id),
});

export const agentProjects = sqliteTable('agent_projects', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  agentId: text('agent_id')
    .notNull()
    .references(() => agents.id),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id),
  role: text('role'),
});

export const skillRules = sqliteTable('skill_resources', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  skillId: text('skill_id')
    .notNull()
    .references(() => skills.id),
  ruleId: text('resource_id')
    .notNull()
    .references(() => rules.id),
});
