// External
import type Database from 'better-sqlite3';

/**
 * SQLite doesn't support ADD COLUMN IF NOT EXISTS.
 * These patches add columns that were introduced after the initial Drizzle migrations.
 * Each is wrapped in try/catch so it's safe to run repeatedly.
 *
 * TODO(migration-reconciliation): fold these into a proper .sql migration, then
 * empty this list. The real blocker is NOT the Node version (Node 24 is fine) —
 * a 2026-06 spike found `drizzle-kit generate` fails to resolve the `.js`-suffixed
 * ESM import specifiers in the schema `.ts` files (`Cannot find module
 * '../helpers/index.js'`). Viable path, to run with a human at an interactive
 * terminal (drizzle-kit prompts and hangs in non-TTY/CI):
 *   1. `pnpm --filter @atlas/server build`, then point drizzle-kit at the
 *      COMPILED schema (`./dist/db/schema/*.schema.js`) where the `.js` imports
 *      resolve — confirmed to get past the resolution error.
 *   2. The generated migration will `ADD COLUMN` columns that EXISTING user DBs
 *      already have (these patches added them outside Drizzle's journal). Make it
 *      tolerant: stamp the journal as applied when the columns are detected, or
 *      keep this idempotent (try/catch) `applySchemaPatches` for one release as a
 *      no-op safety net, then delete it.
 *   3. Enforce going forward: new columns go through `db:generate`, not here.
 */
export function applySchemaPatches(sqlite: Database.Database): void {
  const patches = [
    'ALTER TABLE workspaces ADD COLUMN diff_comments TEXT',
    'ALTER TABLE workspaces ADD COLUMN model TEXT',
    'ALTER TABLE projects ADD COLUMN default_branch TEXT',
    'ALTER TABLE projects ADD COLUMN scan_data TEXT',
    'ALTER TABLE projects ADD COLUMN project_brief TEXT',
    'ALTER TABLE agent_projects ADD COLUMN role TEXT',
    'ALTER TABLE skills ADD COLUMN project_id TEXT REFERENCES projects(id)',
    'ALTER TABLE resources ADD COLUMN project_id TEXT REFERENCES projects(id)',
    'ALTER TABLE agents ADD COLUMN default_model TEXT',
    'ALTER TABLE projects ADD COLUMN design_context TEXT',
    'ALTER TABLE tasks ADD COLUMN workflow_provider_id TEXT',
    'ALTER TABLE workspaces ADD COLUMN base_branch TEXT',
    'ALTER TABLE workspaces ADD COLUMN provider_fallback_reason TEXT',
    'ALTER TABLE agents ADD COLUMN execution_mode TEXT',
    'ALTER TABLE agents ADD COLUMN default_runtime_id TEXT',
    'ALTER TABLE chat_conversations ADD COLUMN execution_mode TEXT',
  ];

  for (const sql of patches) {
    try {
      sqlite.exec(sql);
    } catch {
      // Column already exists
    }
  }
}
