-- Drop old chat tables (schema changed: provider_id became nullable, backend_type/executor_id added)
DROP TABLE IF EXISTS chat_messages;
--> statement-breakpoint
DROP TABLE IF EXISTS chat_conversations;
--> statement-breakpoint

-- Recreate chat tables with current schema
CREATE TABLE IF NOT EXISTS chat_conversations (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT,
  project_id TEXT REFERENCES projects(id),
  backend_type TEXT NOT NULL DEFAULT 'api',
  provider_id TEXT REFERENCES agent_providers(id),
  executor_id TEXT,
  model TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY NOT NULL,
  conversation_id TEXT NOT NULL REFERENCES chat_conversations(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tool_calls TEXT,
  tool_results TEXT,
  created_at TEXT NOT NULL
);
--> statement-breakpoint

-- Create preferences table
CREATE TABLE IF NOT EXISTS preferences (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
