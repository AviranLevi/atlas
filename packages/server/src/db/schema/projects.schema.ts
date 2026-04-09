// External
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

// DB
import { timestampDefault, uuidDefault } from '../helpers/index.js';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(uuidDefault),
  name: text('name').notNull(),
  description: text('description'),
  techStack: text('tech_stack'),
  status: text('status').notNull().default('active'),
  repositoryUrl: text('repository_url'),
  localPath: text('local_path'),
  defaultBranch: text('default_branch'),
  scanData: text('scan_data'), // JSON blob of ProjectScanData
  projectBrief: text('project_brief'), // Auto-generated compressed context for agents
  designContext: text('design_context'), // Human-authored design system context (DESIGN.md) for UI agents
  agentBehavior: text('agent_behavior'), // JSON blob of AgentBehavior settings
  color: text('color'),
  mission: text('mission'),
  createdAt: text('created_at').notNull().$defaultFn(timestampDefault),
  updatedAt: text('updated_at').notNull().$defaultFn(timestampDefault),
});
