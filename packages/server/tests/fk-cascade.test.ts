/**
 * FK cascade policy integration tests.
 *
 * The full production migration chain is already validated end-to-end against
 * a populated DB copy by `scripts/validate-migrations.mjs` (step 3 of the FK
 * cascade plan). What this file pins down is the *policy itself* — the exact
 * ON DELETE behaviour each foreign key promises — using a minimal in-memory
 * schema that mirrors the relevant tables. If a future schema change quietly
 * weakens a cascade or flips RESTRICT to CASCADE on `tasks.agent_id`, these
 * tests fail before the migration ships.
 */
import Database from 'better-sqlite3';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Importing `agents.service.js` transitively pulls in `db/repositories/index.js`,
// which instantiates real repositories against the on-disk SQLite DB at module
// load. Stub the repositories barrel so the test stays hermetic and never
// touches `data/agents.db`. vi.mock is hoisted above the static import below.
vi.mock('../src/db/repositories/index.js', () => ({
  agentsRepository: {},
}));

import { AgentsService } from '../src/services/agents/agents.service.js';

// Minimal SQL mirroring the post-policy schema for tables involved in
// project/agent/provider deletion. Kept small on purpose: testing the policy,
// not the full migration chain.
const SETUP_SQL = `
  CREATE TABLE projects (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE agent_providers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    model_name TEXT NOT NULL
  );

  CREATE TABLE agents (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    provider_id TEXT REFERENCES agent_providers(id) ON DELETE SET NULL
  );

  CREATE TABLE phases (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL
  );

  CREATE TABLE tasks (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE RESTRICT,
    phase_id TEXT REFERENCES phases(id) ON DELETE SET NULL
  );

  CREATE TABLE workspaces (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL
  );

  CREATE TABLE reviews (
    id TEXT PRIMARY KEY NOT NULL,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    reviewer_id TEXT REFERENCES agents(id) ON DELETE SET NULL
  );

  CREATE TABLE chat_conversations (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    backend_type TEXT NOT NULL DEFAULT 'api',
    provider_id TEXT REFERENCES agent_providers(id) ON DELETE SET NULL
  );

  CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY NOT NULL,
    conversation_id TEXT NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE memory (
    id TEXT PRIMARY KEY NOT NULL,
    content TEXT NOT NULL,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE
  );

  CREATE TABLE agent_skills (
    id TEXT PRIMARY KEY NOT NULL,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL
  );

  CREATE TABLE agent_projects (
    id TEXT PRIMARY KEY NOT NULL,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE
  );
`;

function freshDb(): Database.Database {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(SETUP_SQL);
  return sqlite;
}

let db: Database.Database;

beforeEach(() => {
  db = freshDb();
});

describe('FK cascade policy — project delete', () => {
  it('cascades to every transitively-owned table', () => {
    db.exec(`
      INSERT INTO projects (id, name) VALUES ('p1', 'Project 1');
      INSERT INTO agent_providers (id, name, type, model_name) VALUES ('prov1', 'Prov', 'anthropic', 'claude');
      INSERT INTO agents (id, name, provider_id) VALUES ('a1', 'Agent 1', 'prov1');
      INSERT INTO phases (id, project_id, name) VALUES ('ph1', 'p1', 'Phase 1');
      INSERT INTO tasks (id, name, project_id, phase_id) VALUES ('t1', 'Task 1', 'p1', 'ph1');
      INSERT INTO workspaces (id, task_id, project_id, agent_id) VALUES ('w1', 't1', 'p1', 'a1');
      INSERT INTO reviews (id, task_id, reviewer_id) VALUES ('r1', 't1', 'a1');
      INSERT INTO chat_conversations (id, project_id, provider_id) VALUES ('c1', 'p1', 'prov1');
      INSERT INTO chat_messages (id, conversation_id, content) VALUES ('m1', 'c1', 'hi');
      INSERT INTO memory (id, content, project_id, agent_id) VALUES ('mem1', 'note', 'p1', 'a1');
      INSERT INTO agent_projects (id, agent_id, project_id) VALUES ('ap1', 'a1', 'p1');
    `);

    db.prepare('DELETE FROM projects WHERE id = ?').run('p1');

    expect(db.prepare('SELECT COUNT(*) AS n FROM projects').get()).toMatchObject({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM phases').get()).toMatchObject({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM tasks').get()).toMatchObject({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM workspaces').get()).toMatchObject({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM reviews').get()).toMatchObject({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM chat_conversations').get()).toMatchObject({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM chat_messages').get()).toMatchObject({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM memory').get()).toMatchObject({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM agent_projects').get()).toMatchObject({ n: 0 });
    // Agent + provider survive — they're not owned by the project.
    expect(db.prepare('SELECT COUNT(*) AS n FROM agents').get()).toMatchObject({ n: 1 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM agent_providers').get()).toMatchObject({ n: 1 });
  });
});

describe('FK cascade policy — agent delete', () => {
  it('blocks delete when a task is still assigned (RESTRICT)', () => {
    db.exec(`
      INSERT INTO projects (id, name) VALUES ('p1', 'P');
      INSERT INTO agents (id, name) VALUES ('a1', 'Agent');
      INSERT INTO tasks (id, name, project_id, agent_id) VALUES ('t1', 'Task', 'p1', 'a1');
    `);

    expect(() => db.prepare('DELETE FROM agents WHERE id = ?').run('a1')).toThrow(/FOREIGN KEY/i);
    expect(db.prepare('SELECT COUNT(*) AS n FROM agents').get()).toMatchObject({ n: 1 });
  });

  it('succeeds when only workspace/review reference the agent (SET NULL)', () => {
    db.exec(`
      INSERT INTO projects (id, name) VALUES ('p1', 'P');
      INSERT INTO agents (id, name) VALUES ('a1', 'Agent');
      INSERT INTO tasks (id, name, project_id) VALUES ('t1', 'Task', 'p1');
      INSERT INTO workspaces (id, task_id, project_id, agent_id) VALUES ('w1', 't1', 'p1', 'a1');
      INSERT INTO reviews (id, task_id, reviewer_id) VALUES ('r1', 't1', 'a1');
    `);

    db.prepare('DELETE FROM agents WHERE id = ?').run('a1');

    expect(db.prepare('SELECT agent_id FROM workspaces WHERE id = ?').get('w1')).toMatchObject({ agent_id: null });
    expect(db.prepare('SELECT reviewer_id FROM reviews WHERE id = ?').get('r1')).toMatchObject({ reviewer_id: null });
    expect(db.prepare('SELECT COUNT(*) AS n FROM agents').get()).toMatchObject({ n: 0 });
  });

  it('succeeds for a clean orphan agent and cascades through its junction rows', () => {
    db.exec(`
      INSERT INTO projects (id, name) VALUES ('p1', 'P');
      INSERT INTO agents (id, name) VALUES ('a1', 'Agent');
      INSERT INTO agent_skills (id, agent_id, skill_id) VALUES ('as1', 'a1', 's1');
      INSERT INTO agent_projects (id, agent_id, project_id) VALUES ('ap1', 'a1', 'p1');
      INSERT INTO memory (id, content, agent_id) VALUES ('mem1', 'note', 'a1');
    `);

    db.prepare('DELETE FROM agents WHERE id = ?').run('a1');

    expect(db.prepare('SELECT COUNT(*) AS n FROM agents').get()).toMatchObject({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM agent_skills').get()).toMatchObject({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM agent_projects').get()).toMatchObject({ n: 0 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM memory').get()).toMatchObject({ n: 0 });
  });
});

describe('FK cascade policy — provider delete', () => {
  it('nulls out provider_id on agents and chat_conversations (SET NULL)', () => {
    db.exec(`
      INSERT INTO agent_providers (id, name, type, model_name) VALUES ('prov1', 'Prov', 'anthropic', 'claude');
      INSERT INTO agents (id, name, provider_id) VALUES ('a1', 'Agent', 'prov1');
      INSERT INTO chat_conversations (id, provider_id) VALUES ('c1', 'prov1');
    `);

    db.prepare('DELETE FROM agent_providers WHERE id = ?').run('prov1');

    expect(db.prepare('SELECT provider_id FROM agents WHERE id = ?').get('a1')).toMatchObject({ provider_id: null });
    expect(db.prepare('SELECT provider_id FROM chat_conversations WHERE id = ?').get('c1')).toMatchObject({
      provider_id: null,
    });
  });
});

// ---------------------------------------------------------------------------
// AgentsService.delete pre-check (RESTRICT escape hatch)
// ---------------------------------------------------------------------------
//
// The schema raises a generic "FOREIGN KEY constraint failed" string. We
// catch that at the service layer and translate it into a 409 with a
// `{ agentId, agentName, taskCount }` payload so the UI can render a
// targeted toast. These tests pin that translation in place.

describe('AgentsService.delete — RESTRICT pre-check', () => {
  it('throws a 409 AppError with agentName + taskCount when tasks are assigned', async () => {
    const repo = {
      findByIdOrThrow: () => ({ id: 'a1', name: 'Reviewer Bot' }),
      countAssignedTasks: () => 3,
      remove: () => {
        throw new Error('remove should not be called when pre-check fires');
      },
    } as unknown as ConstructorParameters<typeof AgentsService>[0];

    const service = new AgentsService(repo);

    await expect(service.delete('a1')).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('Reviewer Bot'),
      cause: { agentId: 'a1', agentName: 'Reviewer Bot', taskCount: 3 },
    });
  });

  it('proceeds to remove when no tasks reference the agent', async () => {
    let removed = false;
    const repo = {
      findByIdOrThrow: () => ({ id: 'a1', name: 'Idle Bot' }),
      countAssignedTasks: () => 0,
      remove: () => {
        removed = true;
      },
    } as unknown as ConstructorParameters<typeof AgentsService>[0];

    const service = new AgentsService(repo);

    await service.delete('a1');
    expect(removed).toBe(true);
  });

  it('translates a SQLite FK error from the DELETE itself into 409 (TOCTOU race)', async () => {
    // Pre-check sees zero tasks; between the count and the DELETE, a writer
    // assigns a task. The schema-level RESTRICT then raises a generic
    // "FOREIGN KEY constraint failed". The catch must translate that into a
    // 409 so the client doesn't see a misleading 500.
    const repo = {
      findByIdOrThrow: () => ({ id: 'a1', name: 'Race Bot' }),
      countAssignedTasks: () => 0,
      remove: () => {
        throw new Error('FOREIGN KEY constraint failed');
      },
    } as unknown as ConstructorParameters<typeof AgentsService>[0];

    const service = new AgentsService(repo);

    await expect(service.delete('a1')).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('task assignment changed'),
      cause: { agentId: 'a1' },
    });
  });
});
