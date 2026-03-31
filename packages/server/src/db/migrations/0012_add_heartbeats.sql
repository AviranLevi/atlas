CREATE TABLE `heartbeat_configs` (
  `id` text PRIMARY KEY NOT NULL,
  `agent_id` text NOT NULL REFERENCES `agents`(`id`),
  `project_id` text REFERENCES `projects`(`id`),
  `runtime` text NOT NULL,
  `cron_expression` text NOT NULL,
  `enabled` integer NOT NULL DEFAULT 0,
  `max_concurrent` integer NOT NULL DEFAULT 1,
  `max_runs_per_day` integer NOT NULL DEFAULT 5,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `heartbeat_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `config_id` text NOT NULL REFERENCES `heartbeat_configs`(`id`),
  `agent_id` text NOT NULL,
  `workspace_id` text,
  `status` text NOT NULL,
  `result` text,
  `triggered_at` text NOT NULL,
  `completed_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_heartbeat_runs_config` ON `heartbeat_runs`(`config_id`);
--> statement-breakpoint
CREATE INDEX `idx_heartbeat_runs_triggered` ON `heartbeat_runs`(`triggered_at`);
