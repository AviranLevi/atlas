// External
import type Database from 'better-sqlite3';

/**
 * SQLite doesn't support ADD COLUMN IF NOT EXISTS.
 * These patches add columns that were introduced after the initial Drizzle migrations.
 * Each is wrapped in try/catch so it's safe to run repeatedly.
 *
 * TODO: Once Node is upgraded to >=24 (or drizzle-kit's CJS loader is fixed),
 * run `pnpm --filter @atlas/server db:generate` to produce a proper .sql migration
 * for every entry below, then empty this list. Each patch here is schema drift
 * that drizzle-kit doesn't know about — `db:generate` will try to re-add them,
 * producing duplicate-column migration errors until reconciled.
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
  ];

  for (const sql of patches) {
    try {
      sqlite.exec(sql);
    } catch {
      // Column already exists
    }
  }
}
