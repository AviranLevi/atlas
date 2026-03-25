CREATE TABLE `chat_conversations` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text,
  `project_id` text REFERENCES `projects`(`id`),
  `provider_id` text NOT NULL REFERENCES `agent_providers`(`id`),
  `model` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
  `id` text PRIMARY KEY NOT NULL,
  `conversation_id` text NOT NULL REFERENCES `chat_conversations`(`id`),
  `role` text NOT NULL,
  `content` text NOT NULL DEFAULT '',
  `tool_calls` text,
  `tool_results` text,
  `created_at` text NOT NULL
);
