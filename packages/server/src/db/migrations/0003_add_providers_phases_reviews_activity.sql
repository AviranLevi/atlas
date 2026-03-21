CREATE TABLE `agent_providers` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `api_key` text,
  `base_url` text,
  `model_name` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `phases` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL REFERENCES `projects`(`id`),
  `name` text NOT NULL,
  `description` text,
  `status` text NOT NULL DEFAULT 'planning',
  `order_index` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reviews` (
  `id` text PRIMARY KEY NOT NULL,
  `task_id` text NOT NULL REFERENCES `tasks`(`id`),
  `reviewer_id` text REFERENCES `agents`(`id`),
  `reviewer_type` text NOT NULL DEFAULT 'human',
  `status` text NOT NULL DEFAULT 'pending',
  `checklist` text,
  `notes` text,
  `decided_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `activity_log` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text,
  `agent_id` text,
  `task_id` text,
  `workspace_id` text,
  `event_type` text NOT NULL,
  `description` text NOT NULL,
  `metadata` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `agents` ADD `provider_id` text REFERENCES `agent_providers`(`id`);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `phase_id` text REFERENCES `phases`(`id`);
