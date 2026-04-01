// External
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

// DB
import * as schema from './schema/index.js';
import { applySchemaPatches } from './schema-patches.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPackageRoot = path.resolve(__dirname, '../..');
const dbPath = path.resolve(serverPackageRoot, '../../data/agents.db');
const migrationsFolder = path.resolve(__dirname, './migrations');

console.error(`[DB] Initializing database at: ${dbPath}`);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

try {
  migrate(db, { migrationsFolder });
} catch (err) {
  console.error('[DB] ❌ Migration failed. This usually means a .sql file in src/db/migrations/ is malformed.');
  console.error('[DB]    Migrations must use --> statement-breakpoint between SQL statements.');
  console.error('[DB]    Use "pnpm db:generate" to create migrations from schema changes — never hand-write them.');
  console.error('[DB]    Error:', err instanceof Error ? err.message : err);
  process.exit(1);
}

applySchemaPatches(sqlite);

console.error(`[DB] Database initialized successfully`);

export { schema };
export type DB = typeof db;
