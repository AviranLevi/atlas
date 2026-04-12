ALTER TABLE `workspaces` ADD COLUMN `input_tokens` integer;
--> statement-breakpoint
ALTER TABLE `workspaces` ADD COLUMN `output_tokens` integer;
--> statement-breakpoint
ALTER TABLE `workspaces` ADD COLUMN `cost_usd` real;
