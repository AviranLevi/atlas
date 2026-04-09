ALTER TABLE memory ADD COLUMN status text NOT NULL DEFAULT 'active';
--> statement-breakpoint
ALTER TABLE memory ADD COLUMN superseded_by text REFERENCES memory(id);
--> statement-breakpoint
ALTER TABLE memory ADD COLUMN is_pinned integer NOT NULL DEFAULT 0;
