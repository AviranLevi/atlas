CREATE TABLE `mcp_servers` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL UNIQUE,
  `command` text NOT NULL,
  `args` text,
  `env` text,
  `enabled` integer NOT NULL DEFAULT 1,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
