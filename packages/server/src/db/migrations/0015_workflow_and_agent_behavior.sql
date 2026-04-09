-- Add agent behavior settings to projects (JSON blob with toggles)
ALTER TABLE projects ADD COLUMN agent_behavior text;

-- Add workflow fields to tasks
ALTER TABLE tasks ADD COLUMN workflow_enabled integer NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN workflow_stage text;

-- Add workflow stage tracking to workspaces
ALTER TABLE workspaces ADD COLUMN workflow_stage text;
