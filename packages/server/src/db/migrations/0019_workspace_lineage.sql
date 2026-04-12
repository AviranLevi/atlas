ALTER TABLE `workspaces` ADD COLUMN `parent_workspace_id` text REFERENCES `workspaces`(`id`);
