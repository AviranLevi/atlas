CREATE TABLE `model_cache` (
  `provider_type` text PRIMARY KEY NOT NULL,
  `models` text NOT NULL DEFAULT '[]',
  `fetched_at` text NOT NULL
);
