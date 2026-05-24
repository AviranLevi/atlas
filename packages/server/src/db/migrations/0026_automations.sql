CREATE TABLE `automations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`agent_id` text REFERENCES `agents`(`id`) ON DELETE SET NULL,
	`prompt_template` text NOT NULL,
	`icon` text,
	`project_id` text REFERENCES `projects`(`id`) ON DELETE CASCADE,
	`sort_order` integer NOT NULL DEFAULT 0,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
