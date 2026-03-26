// External
import type { Context } from 'hono';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// DB
import { db } from '../db/index.js';
import {
  activityLog,
  agentProjects,
  agentProviders,
  agentRules,
  agents,
  agentSkills,
  chatConversations,
  chatMessages,
  dispatchRules,
  globalInstructions,
  memory,
  phases,
  preferences,
  projects,
  reviews,
  rules,
  skillRules,
  skills,
  tasks,
  workspaces,
} from '../db/schema/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPackageRoot = path.resolve(__dirname, '../..');
const dbPath = path.resolve(serverPackageRoot, '../../data/agents.db');

/** Returns server metadata and database file stats. */
export async function getSystemInfo(c: Context): Promise<Response> {
  const dbStat = fs.statSync(dbPath);
  return c.json({
    version: '0.0.1',
    apiUrl: 'http://localhost:3100',
    dbPath,
    dbSizeBytes: dbStat.size,
    uptimeSeconds: process.uptime(),
    nodeVersion: process.version,
  });
}

/** Streams the SQLite database file as a download. */
export async function exportDatabase(c: Context): Promise<Response> {
  const buffer = fs.readFileSync(dbPath);
  const filename = path.basename(dbPath);
  c.header('Content-Type', 'application/octet-stream');
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  return c.body(buffer);
}

/** Deletes all rows from every application table (FK order). */
export async function resetDatabase(c: Context): Promise<Response> {
  db.delete(chatMessages).run();
  db.delete(chatConversations).run();
  db.delete(workspaces).run();
  db.delete(reviews).run();
  db.delete(tasks).run();
  db.delete(memory).run();
  db.delete(agentProjects).run();
  db.delete(agentSkills).run();
  db.delete(agentRules).run();
  db.delete(skillRules).run();
  db.delete(phases).run();
  db.delete(dispatchRules).run();
  db.delete(skills).run();
  db.delete(rules).run();
  db.delete(globalInstructions).run();
  db.delete(activityLog).run();
  db.delete(preferences).run();
  db.delete(agents).run();
  db.delete(projects).run();
  db.delete(agentProviders).run();
  return c.body(null, 204);
}
