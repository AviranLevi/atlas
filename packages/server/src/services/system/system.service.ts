// External
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);
const _pkg = _require('../../../package.json') as { version: string };

// DB
import { db } from '../../db/index.js';
import {
  activityLog,
  agentProjects,
  agentProviders,
  agentRules,
  agentSkills,
  agents,
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

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

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

export type UpdateCheckResult = {
  current: string;
  latest: string;
  hasUpdate: boolean;
  releaseUrl: string | null;
};

export class SystemService {
  /** Returns server metadata and database file stats. */
  getInfo(): SystemInfo {
    const dbStat = fs.statSync(dbPath);
    return {
      version: _pkg.version,
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

  /** Checks GitHub releases for a newer version of Atlas. */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    const FUNCTION_NAME = 'checkForUpdates';
    const current = this.getInfo().version;
    try {
      const response = await fetch('https://api.github.com/repos/AviranLevi/atlas/releases/latest', {
        headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      });
      if (response.status === 404) {
        return { current, latest: current, hasUpdate: false, releaseUrl: null };
      }
      if (!response.ok) throw new Error(`GitHub API responded with ${response.status}`);
      const data = (await response.json()) as { tag_name: string; html_url: string };
      const latest = data.tag_name.replace(/^v/, '');
      return { current, latest, hasUpdate: latest !== current, releaseUrl: data.html_url };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to check for updates', { cause: error });
    }
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
