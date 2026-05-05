CREATE TABLE `pipelines` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`status` text NOT NULL DEFAULT 'idle',
	`current_task_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pipeline_tasks` (
	`pipeline_id` text NOT NULL,
	`task_id` text NOT NULL,
	`position` integer NOT NULL,
	`auto_review` integer NOT NULL DEFAULT false,
	`auto_accept` integer NOT NULL DEFAULT false,
	`base_strategy` text NOT NULL DEFAULT 'previous',
	`status` text NOT NULL DEFAULT 'queued',
	`workspace_id` text,
	`started_at` text,
	`completed_at` text,
	FOREIGN KEY (`pipeline_id`) REFERENCES `pipelines`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `pipeline_tasks_pipeline_id_idx` ON `pipeline_tasks` (`pipeline_id`);
--> statement-breakpoint
CREATE INDEX `pipeline_tasks_task_id_idx` ON `pipeline_tasks` (`task_id`);
--> statement-breakpoint
CREATE INDEX `pipeline_tasks_workspace_id_idx` ON `pipeline_tasks` (`workspace_id`);
