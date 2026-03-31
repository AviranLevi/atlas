CREATE TABLE `usage_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `workspace_id` text REFERENCES `workspaces`(`id`),
  `conversation_id` text,
  `agent_id` text REFERENCES `agents`(`id`),
  `task_id` text REFERENCES `tasks`(`id`),
  `project_id` text REFERENCES `projects`(`id`),
  `input_tokens` integer NOT NULL DEFAULT 0,
  `output_tokens` integer NOT NULL DEFAULT 0,
  `total_tokens` integer NOT NULL DEFAULT 0,
  `model` text,
  `provider_type` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_usage_logs_agent` ON `usage_logs`(`agent_id`);
--> statement-breakpoint
CREATE INDEX `idx_usage_logs_project` ON `usage_logs`(`project_id`);
--> statement-breakpoint
CREATE INDEX `idx_usage_logs_created` ON `usage_logs`(`created_at`);
