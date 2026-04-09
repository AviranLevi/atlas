-- Add agent behavior settings to projects (JSON blob with toggles)
ALTER TABLE projects ADD COLUMN agent_behavior text;
--> statement-breakpoint
-- Add workflow fields to tasks
ALTER TABLE tasks ADD COLUMN workflow_enabled integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE tasks ADD COLUMN workflow_stage text;
--> statement-breakpoint
-- Add workflow stage tracking to workspaces
ALTER TABLE workspaces ADD COLUMN workflow_stage text;
