import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../../db/index.js';
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
} from '../../db/schema/index.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

const FILE_PATH = 'services/system/system.service.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPackageRoot = path.resolve(__dirname, '../../..');
const dbPath = path.resolve(serverPackageRoot, '../../data/agents.db');

export type SystemInfo = {
  version: string;
  apiUrl: string;
  dbPath: string;
  dbSizeBytes: number;
  uptimeSeconds: number;
  nodeVersion: string;
};

export class SystemService {
  /** Returns server metadata and database file stats. */
  getInfo(): SystemInfo {
    const dbStat = fs.statSync(dbPath);
    return {
      version: '0.0.1',
      apiUrl: 'http://localhost:3100',
      dbPath,
      dbSizeBytes: dbStat.size,
      uptimeSeconds: process.uptime(),
      nodeVersion: process.version,
    };
  }

  /** Returns the raw database file as a Uint8Array for download. */
  exportDatabase(): { data: Uint8Array; filename: string } {
    const buffer = fs.readFileSync(dbPath);
    return { data: new Uint8Array(buffer), filename: path.basename(dbPath) };
  }

  /** Deletes all rows from every application table (FK order). */
  resetDatabase(): void {
    const FUNCTION_NAME = 'resetDatabase';
    try {
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
      logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - database reset complete`);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to reset database', { cause: error });
    }
  }
}
