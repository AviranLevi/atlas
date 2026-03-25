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

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT,
    project_id TEXT REFERENCES projects(id),
    provider_id TEXT NOT NULL REFERENCES agent_providers(id),
    model TEXT NOT NULL,
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
