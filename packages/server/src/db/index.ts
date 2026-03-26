import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPackageRoot = path.resolve(__dirname, '../..');
const dbPath = path.resolve(serverPackageRoot, '../../data/agents.db');
const migrationsFolder = path.resolve(__dirname, './migrations');

console.error(`[DB] Initializing database at: ${dbPath}`);
console.error(`[DB] Migrations folder: ${migrationsFolder}`);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder });
console.error(`[DB] Database initialized successfully`);

// Manual column additions for columns added after initial drizzle migration setup.
// SQLite ALTER TABLE ADD COLUMN is idempotent-safe with the "IF NOT EXISTS" workaround.
try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN diff_comments TEXT`);
} catch {
  // Column already exists — ignore
}

try {
  sqlite.exec(`ALTER TABLE projects ADD COLUMN default_branch TEXT`);
} catch {
  // Column already exists — ignore
}

try {
  sqlite.exec(`ALTER TABLE projects ADD COLUMN scan_data TEXT`);
} catch {
  // Column already exists — ignore
}

try {
  sqlite.exec(`ALTER TABLE projects ADD COLUMN project_brief TEXT`);
} catch {
  // Column already exists — ignore
}

try {
  sqlite.exec(`ALTER TABLE agent_projects ADD COLUMN role TEXT`);
} catch {
  // Column already exists — ignore
}

try {
  sqlite.exec(`ALTER TABLE skills ADD COLUMN project_id TEXT REFERENCES projects(id)`);
} catch {
  // Column already exists — ignore
}

try {
  sqlite.exec(`ALTER TABLE resources ADD COLUMN project_id TEXT REFERENCES projects(id)`);
} catch {
  // Column already exists — ignore
}

try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN model TEXT`);
} catch {
  // Column already exists — ignore
}

try {
  sqlite.exec(`ALTER TABLE agents ADD COLUMN default_model TEXT`);
} catch {
  // Column already exists — ignore
}

// One-time migration: recreate chat tables if they have the old schema (provider_id NOT NULL).
// SQLite doesn't support ALTER COLUMN, so we must drop and recreate.
{
  const tableInfo = sqlite.pragma('table_info(chat_conversations)') as Array<{ name: string; notnull: number }>;
  const providerCol = tableInfo.find((c) => c.name === 'provider_id');
  const needsMigration = providerCol?.notnull === 1 || !tableInfo.find((c) => c.name === 'backend_type');

  if (needsMigration && tableInfo.length > 0) {
    sqlite.exec(`DROP TABLE IF EXISTS chat_messages`);
    sqlite.exec(`DROP TABLE IF EXISTS chat_conversations`);
  }
}

sqlite.exec(`
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
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY NOT NULL,
    conversation_id TEXT NOT NULL REFERENCES chat_conversations(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tool_calls TEXT,
    tool_results TEXT,
    created_at TEXT NOT NULL
  )
`);

export { schema };
export type DB = typeof db;
