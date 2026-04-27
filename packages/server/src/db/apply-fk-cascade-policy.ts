// External
import type Database from 'better-sqlite3';

/**
 * Applies the schema-level FK cascade policy by recreating every table whose
 * foreign keys need ON DELETE behavior changed.
 *
 * Why this lives here, not in a `.sql` migration file:
 *   Drizzle's better-sqlite3 migrator wraps the entire migration file in a
 *   single BEGIN/COMMIT. SQLite ignores `PRAGMA foreign_keys = OFF/ON` inside
 *   a transaction (only effective in autocommit mode). Without that pragma,
 *   `DROP TABLE` of a parent fails when child rows still reference it — even
 *   with `PRAGMA defer_foreign_keys = ON`, which only defers row-level checks,
 *   not table-level ones.
 *
 *   Solution: run the recreate logic outside the migrator, in autocommit mode,
 *   so we can toggle foreign_keys off, do the rebuild atomically inside our
 *   own BEGIN/COMMIT, verify integrity with `foreign_key_check`, and re-enable
 *   foreign_keys afterward.
 *
 * Idempotency: we sample one known FK (chat_messages.conversation_id) via
 * `pragma_foreign_key_list`. If it already has on_delete = 'CASCADE', the
 * policy has been applied; we no-op.
 *
 * Cascade policy reference: see `.cursor/plans/fk_cascade_policy_v0.1_*.plan.md`.
 */
export function applyFkCascadePolicy(sqlite: Database.Database): void {
  if (isAlreadyApplied(sqlite)) return;

  console.error('[DB] Applying FK cascade policy (one-time table rebuild)…');

  sqlite.pragma('foreign_keys = OFF');
  try {
    sqlite.exec('BEGIN');
    try {
      for (const stmt of RECREATE_STATEMENTS) {
        sqlite.exec(stmt);
      }

      const violations = sqlite.prepare('PRAGMA foreign_key_check').all() as unknown[];
      if (violations.length > 0) {
        throw new Error(`foreign_key_check returned ${violations.length} violation(s): ${JSON.stringify(violations)}`);
      }

      sqlite.exec('COMMIT');
    } catch (err) {
      sqlite.exec('ROLLBACK');
      throw err;
    }
  } finally {
    sqlite.pragma('foreign_keys = ON');
  }

  console.error('[DB] FK cascade policy applied successfully.');
}

function isAlreadyApplied(sqlite: Database.Database): boolean {
  const rows = sqlite.prepare("SELECT on_delete FROM pragma_foreign_key_list('chat_messages')").all() as Array<{
    on_delete: string;
  }>;
  return rows.length > 0 && rows[0].on_delete.toUpperCase() === 'CASCADE';
}

/**
 * Each entry rebuilds one table. Order: leaf tables first so a partial failure
 * (rolled back via our own transaction wrapper) still leaves the DB internally
 * consistent under foreign_keys=ON. INSERT...SELECT lists columns explicitly to
 * tolerate column-order drift between the live DB and a fresh schema.
 *
 * Drift handled:
 *   - tasks.skill_id: present in DB, never used by app, no rows populated.
 *     Dropped during rebuild.
 *   - memory.superseded_by: not in Drizzle schema (drizzle can't express
 *     self-FKs), preserved with self-FK ON DELETE SET NULL.
 *   - workspaces.parent_workspace_id: same — preserved with self-FK ON DELETE
 *     SET NULL so deleting a parent workspace doesn't kill its lineage children.
 */
const RECREATE_STATEMENTS: string[] = [
  // --- Leaf / join tables ------------------------------------------------
  `CREATE TABLE __new_agent_skills (
    id TEXT PRIMARY KEY NOT NULL,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE
  );
  INSERT INTO __new_agent_skills (id, agent_id, skill_id) SELECT id, agent_id, skill_id FROM agent_skills;
  DROP TABLE agent_skills;
  ALTER TABLE __new_agent_skills RENAME TO agent_skills;
  CREATE UNIQUE INDEX idx_agent_skills_unique ON agent_skills(agent_id, skill_id);`,

  `CREATE TABLE __new_agent_resources (
    id TEXT PRIMARY KEY NOT NULL,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE
  );
  INSERT INTO __new_agent_resources (id, agent_id, resource_id) SELECT id, agent_id, resource_id FROM agent_resources;
  DROP TABLE agent_resources;
  ALTER TABLE __new_agent_resources RENAME TO agent_resources;
  CREATE UNIQUE INDEX idx_agent_resources_unique ON agent_resources(agent_id, resource_id);`,

  `CREATE TABLE __new_agent_projects (
    id TEXT PRIMARY KEY NOT NULL,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role TEXT
  );
  INSERT INTO __new_agent_projects (id, agent_id, project_id, role) SELECT id, agent_id, project_id, role FROM agent_projects;
  DROP TABLE agent_projects;
  ALTER TABLE __new_agent_projects RENAME TO agent_projects;
  CREATE UNIQUE INDEX idx_agent_projects_unique ON agent_projects(agent_id, project_id);`,

  `CREATE TABLE __new_skill_resources (
    id TEXT PRIMARY KEY NOT NULL,
    skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE
  );
  INSERT INTO __new_skill_resources (id, skill_id, resource_id) SELECT id, skill_id, resource_id FROM skill_resources;
  DROP TABLE skill_resources;
  ALTER TABLE __new_skill_resources RENAME TO skill_resources;
  CREATE UNIQUE INDEX idx_skill_resources_unique ON skill_resources(skill_id, resource_id);`,

  `CREATE TABLE __new_dispatch_rules (
    id TEXT PRIMARY KEY NOT NULL,
    pattern TEXT NOT NULL,
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    skill_id TEXT REFERENCES skills(id) ON DELETE CASCADE,
    auto_start INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO __new_dispatch_rules (id, pattern, agent_id, skill_id, auto_start, created_at, updated_at)
    SELECT id, pattern, agent_id, skill_id, auto_start, created_at, updated_at FROM dispatch_rules;
  DROP TABLE dispatch_rules;
  ALTER TABLE __new_dispatch_rules RENAME TO dispatch_rules;`,

  // --- Heartbeats (runs depend on configs) -------------------------------
  `CREATE TABLE __new_heartbeat_runs (
    id TEXT PRIMARY KEY NOT NULL,
    config_id TEXT NOT NULL REFERENCES heartbeat_configs(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    workspace_id TEXT,
    status TEXT NOT NULL,
    result TEXT,
    triggered_at TEXT NOT NULL,
    completed_at TEXT
  );
  INSERT INTO __new_heartbeat_runs (id, config_id, agent_id, workspace_id, status, result, triggered_at, completed_at)
    SELECT id, config_id, agent_id, workspace_id, status, result, triggered_at, completed_at FROM heartbeat_runs;
  DROP TABLE heartbeat_runs;
  ALTER TABLE __new_heartbeat_runs RENAME TO heartbeat_runs;
  CREATE INDEX idx_heartbeat_runs_config ON heartbeat_runs(config_id);
  CREATE INDEX idx_heartbeat_runs_triggered ON heartbeat_runs(triggered_at);`,

  `CREATE TABLE __new_heartbeat_configs (
    id TEXT PRIMARY KEY NOT NULL,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    runtime TEXT NOT NULL,
    cron_expression TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 0,
    max_concurrent INTEGER NOT NULL DEFAULT 1,
    max_runs_per_day INTEGER NOT NULL DEFAULT 5,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO __new_heartbeat_configs (id, agent_id, project_id, runtime, cron_expression, enabled, max_concurrent, max_runs_per_day, created_at, updated_at)
    SELECT id, agent_id, project_id, runtime, cron_expression, enabled, max_concurrent, max_runs_per_day, created_at, updated_at FROM heartbeat_configs;
  DROP TABLE heartbeat_configs;
  ALTER TABLE __new_heartbeat_configs RENAME TO heartbeat_configs;`,

  // --- Chat (messages depend on conversations) ---------------------------
  `CREATE TABLE __new_chat_messages (
    id TEXT PRIMARY KEY NOT NULL,
    conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tool_calls TEXT,
    tool_results TEXT,
    attachments TEXT,
    created_at TEXT NOT NULL
  );
  INSERT INTO __new_chat_messages (id, conversation_id, role, content, tool_calls, tool_results, attachments, created_at)
    SELECT id, conversation_id, role, content, tool_calls, tool_results, attachments, created_at FROM chat_messages;
  DROP TABLE chat_messages;
  ALTER TABLE __new_chat_messages RENAME TO chat_messages;
  CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);`,

  `CREATE TABLE __new_chat_conversations (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    backend_type TEXT NOT NULL DEFAULT 'api',
    provider_id TEXT REFERENCES agent_providers(id) ON DELETE SET NULL,
    executor_id TEXT,
    model TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO __new_chat_conversations (id, title, project_id, backend_type, provider_id, executor_id, model, created_at, updated_at)
    SELECT id, title, project_id, backend_type, provider_id, executor_id, model, created_at, updated_at FROM chat_conversations;
  DROP TABLE chat_conversations;
  ALTER TABLE __new_chat_conversations RENAME TO chat_conversations;
  CREATE INDEX idx_chat_conversations_project_id ON chat_conversations(project_id);`,

  // --- Reviews / Workspaces (depend on tasks, agents) --------------------
  `CREATE TABLE __new_reviews (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    reviewer_type TEXT NOT NULL DEFAULT 'human',
    status TEXT NOT NULL DEFAULT 'pending',
    checklist TEXT,
    notes TEXT,
    decided_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO __new_reviews (id, task_id, reviewer_id, reviewer_type, status, checklist, notes, decided_at, created_at, updated_at)
    SELECT id, task_id, reviewer_id, reviewer_type, status, checklist, notes, decided_at, created_at, updated_at FROM reviews;
  DROP TABLE reviews;
  ALTER TABLE __new_reviews RENAME TO reviews;
  CREATE INDEX idx_reviews_task_id ON reviews(task_id);`,

  `CREATE TABLE __new_workspaces (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
    agent_runtime TEXT NOT NULL,
    model TEXT,
    branch_name TEXT NOT NULL,
    base_branch TEXT,
    worktree_path TEXT NOT NULL,
    pid INTEGER,
    status TEXT NOT NULL DEFAULT 'pending',
    output TEXT,
    workflow_stage TEXT,
    parent_workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    provider_fallback_reason TEXT,
    diff_comments TEXT,
    current_stage TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    cost_usd REAL,
    started_at TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO __new_workspaces (id, task_id, project_id, agent_id, agent_runtime, model, branch_name, base_branch, worktree_path, pid, status, output, workflow_stage, parent_workspace_id, provider_fallback_reason, diff_comments, current_stage, input_tokens, output_tokens, cost_usd, started_at, completed_at, created_at, updated_at)
    SELECT id, task_id, project_id, agent_id, agent_runtime, model, branch_name, base_branch, worktree_path, pid, status, output, workflow_stage, parent_workspace_id, provider_fallback_reason, diff_comments, current_stage, input_tokens, output_tokens, cost_usd, started_at, completed_at, created_at, updated_at FROM workspaces;
  DROP TABLE workspaces;
  ALTER TABLE __new_workspaces RENAME TO workspaces;
  CREATE INDEX idx_workspaces_task_id ON workspaces(task_id);`,

  // --- Tasks (depends on projects, agents, phases) -----------------------
  // Drops the unused skill_id column (drift; never populated, never wired
  // through Drizzle schema). Keeps everything else.
  `CREATE TABLE __new_tasks (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    status TEXT,
    priority TEXT,
    estimate TEXT,
    definition_of_done TEXT,
    notes TEXT,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE RESTRICT,
    phase_id TEXT REFERENCES phases(id) ON DELETE SET NULL,
    source TEXT,
    tags TEXT,
    workflow_enabled INTEGER NOT NULL DEFAULT 0,
    workflow_stage TEXT,
    workflow_provider_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO __new_tasks (id, name, status, priority, estimate, definition_of_done, notes, project_id, agent_id, phase_id, source, tags, workflow_enabled, workflow_stage, workflow_provider_id, created_at, updated_at)
    SELECT id, name, status, priority, estimate, definition_of_done, notes, project_id, agent_id, phase_id, source, tags, workflow_enabled, workflow_stage, workflow_provider_id, created_at, updated_at FROM tasks;
  DROP TABLE tasks;
  ALTER TABLE __new_tasks RENAME TO tasks;
  CREATE INDEX idx_tasks_project_id ON tasks(project_id);
  CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
  CREATE INDEX idx_tasks_phase_id ON tasks(phase_id);
  CREATE INDEX idx_tasks_status ON tasks(status);`,

  // --- Phases / Memory (depend on projects, agents) ----------------------
  `CREATE TABLE __new_phases (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    success_criteria TEXT,
    status TEXT NOT NULL DEFAULT 'planning',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO __new_phases (id, project_id, name, description, success_criteria, status, order_index, created_at, updated_at)
    SELECT id, project_id, name, description, success_criteria, status, order_index, created_at, updated_at FROM phases;
  DROP TABLE phases;
  ALTER TABLE __new_phases RENAME TO phases;
  CREATE INDEX idx_phases_project_id ON phases(project_id);`,

  `CREATE TABLE __new_memory (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT,
    content TEXT NOT NULL,
    type TEXT,
    scope TEXT,
    last_used TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    superseded_by TEXT REFERENCES memory(id) ON DELETE SET NULL,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO __new_memory (id, name, content, type, scope, last_used, status, superseded_by, is_pinned, project_id, agent_id, created_at, updated_at)
    SELECT id, name, content, type, scope, last_used, status, superseded_by, is_pinned, project_id, agent_id, created_at, updated_at FROM memory;
  DROP TABLE memory;
  ALTER TABLE __new_memory RENAME TO memory;
  CREATE INDEX idx_memory_project_id ON memory(project_id);
  CREATE INDEX idx_memory_agent_id ON memory(agent_id);`,

  // --- Resources (rules) / Skills / Agents -------------------------------
  `CREATE TABLE __new_resources (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    tags TEXT,
    content TEXT,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO __new_resources (id, name, type, tags, content, project_id, created_at, updated_at)
    SELECT id, name, type, tags, content, project_id, created_at, updated_at FROM resources;
  DROP TABLE resources;
  ALTER TABLE __new_resources RENAME TO resources;
  CREATE INDEX idx_rules_project_id ON resources(project_id);`,

  `CREATE TABLE __new_skills (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    steps TEXT,
    input_format TEXT,
    output_format TEXT,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO __new_skills (id, name, type, steps, input_format, output_format, project_id, created_at, updated_at)
    SELECT id, name, type, steps, input_format, output_format, project_id, created_at, updated_at FROM skills;
  DROP TABLE skills;
  ALTER TABLE __new_skills RENAME TO skills;
  CREATE INDEX idx_skills_project_id ON skills(project_id);`,

  `CREATE TABLE __new_agents (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    personality TEXT,
    unbreakable_rules TEXT,
    provider_id TEXT REFERENCES agent_providers(id) ON DELETE SET NULL,
    default_model TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  INSERT INTO __new_agents (id, name, description, personality, unbreakable_rules, provider_id, default_model, created_at, updated_at)
    SELECT id, name, description, personality, unbreakable_rules, provider_id, default_model, created_at, updated_at FROM agents;
  DROP TABLE agents;
  ALTER TABLE __new_agents RENAME TO agents;`,
];
