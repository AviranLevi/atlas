ALTER TABLE `projects` ADD `local_path` text;--> statement-breakpoint
CREATE TABLE `workspaces` (
  `id` text PRIMARY KEY NOT NULL,
  `task_id` text NOT NULL REFERENCES `tasks`(`id`),
  `project_id` text NOT NULL REFERENCES `projects`(`id`),
  `agent_id` text REFERENCES `agents`(`id`),
  `agent_runtime` text NOT NULL,
  `branch_name` text NOT NULL,
  `worktree_path` text NOT NULL,
  `pid` integer,
  `status` text NOT NULL DEFAULT 'pending',
  `output` text,
  `started_at` text,
  `completed_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
