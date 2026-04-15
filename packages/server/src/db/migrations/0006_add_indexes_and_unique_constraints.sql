-- Add missing columns (were added via drizzle push, never migrated)
ALTER TABLE `skills` ADD `project_id` text REFERENCES `projects`(`id`);
--> statement-breakpoint
ALTER TABLE `resources` ADD `project_id` text REFERENCES `projects`(`id`);
--> statement-breakpoint
ALTER TABLE `agents` ADD `default_model` text;
--> statement-breakpoint
ALTER TABLE `projects` ADD `default_branch` text;
--> statement-breakpoint
ALTER TABLE `projects` ADD `scan_data` text;
--> statement-breakpoint
ALTER TABLE `projects` ADD `project_brief` text;
--> statement-breakpoint
ALTER TABLE `projects` ADD `design_context` text;
--> statement-breakpoint

-- Secondary indexes on FK/filter columns for query performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON tasks(phase_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_chat_conversations_project_id ON chat_conversations(project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_phases_project_id ON phases(project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_reviews_task_id ON reviews(task_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_memory_project_id ON memory(project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_memory_agent_id ON memory(agent_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_workspaces_task_id ON workspaces(task_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON activity_log(project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_skills_project_id ON skills(project_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_rules_project_id ON resources(project_id);
--> statement-breakpoint

-- Unique constraints on junction table logical pairs to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_skills_unique ON agent_skills(agent_id, skill_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_resources_unique ON agent_resources(agent_id, resource_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_projects_unique ON agent_projects(agent_id, project_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_resources_unique ON skill_resources(skill_id, resource_id);
