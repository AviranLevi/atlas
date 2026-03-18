ALTER TABLE `projects` ADD `status` text NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `projects` ADD `repository_url` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `color` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `tags` text;
