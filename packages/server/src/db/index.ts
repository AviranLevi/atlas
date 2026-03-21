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

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

migrate(db, { migrationsFolder });

// Manual column additions for columns added after initial drizzle migration setup.
// SQLite ALTER TABLE ADD COLUMN is idempotent-safe with the "IF NOT EXISTS" workaround.
try {
  sqlite.exec(`ALTER TABLE workspaces ADD COLUMN diff_comments TEXT`);
} catch {
  // Column already exists — ignore
}

export { schema };
export type DB = typeof db;
