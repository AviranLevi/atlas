CREATE TABLE `project_docs` (
  `id` text PRIMARY KEY NOT NULL,
  `project_id` text NOT NULL REFERENCES `projects`(`id`) ON DELETE CASCADE,
  `title` text NOT NULL,
  `type` text NOT NULL DEFAULT 'custom',
  `content` text NOT NULL DEFAULT '',
  `source` text NOT NULL DEFAULT 'user',
  `generated_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `project_docs_project_id_idx` ON `project_docs` (`project_id`);
--> statement-breakpoint
CREATE INDEX `project_docs_type_idx` ON `project_docs` (`type`);
