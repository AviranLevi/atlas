// External
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const _require = createRequire(import.meta.url);
const _pkg = _require('../../../package.json') as { version: string };

// Shared
import type { SystemInfo, UpdateCheckResult, UpdateProgress } from '@atlas/shared';

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
  heartbeatConfigs,
  heartbeatRuns,
  integrations,
  mcpServers,
  memory,
  modelCache,
  phases,
  pipelines,
  pipelineTasks,
  preferences,
  projectDocs,
  projects,
  quickActions,
  reviews,
  rules,
  skillRules,
  skills,
  tasks,
  usageLogs,
  workspaces,
} from '../../db/schema/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/system/system.service.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPackageRoot = path.resolve(__dirname, '../../..');
const dbPath = path.resolve(serverPackageRoot, '../../data/agents.db');

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

  /** Reads the update progress file written by the self-update script. */
  getUpdateProgress(): UpdateProgress {
    const atlasHome = process.env.ATLAS_HOME || path.join(os.homedir(), '.atlas');
    const progressPath = path.join(atlasHome, 'update-progress.json');
    try {
      if (!fs.existsSync(progressPath)) return { status: 'idle' };
      const raw = fs.readFileSync(progressPath, 'utf-8');
      return JSON.parse(raw) as UpdateProgress;
    } catch {
      return { status: 'idle' };
    }
  }

  /** Spawns the self-update script as a detached process and schedules server shutdown. */
  performUpdate(): { status: 'updating'; startedAt: string } {
    const FUNCTION_NAME = 'performUpdate';
    try {
      const atlasHome = process.env.ATLAS_HOME || path.join(os.homedir(), '.atlas');
      const scriptPath = path.join(atlasHome, 'scripts', 'self-update.sh');

      if (!fs.existsSync(scriptPath)) {
        throw new AppError('Update script not found. Is Atlas installed via the CLI?', { status: 404 });
      }

      // Guard against concurrent updates
      const progress = this.getUpdateProgress();
      if (progress.status === 'updating') {
        throw new AppError('An update is already in progress', { status: 409 });
      }

      const startedAt = new Date().toISOString();

      // Write initial progress
      const progressPath = path.join(atlasHome, 'update-progress.json');
      fs.writeFileSync(
        progressPath,
        JSON.stringify({
          status: 'updating',
          step: 'starting',
          steps: ['fetching', 'installing', 'building', 'starting'],
          currentStep: 0,
          startedAt,
          error: null,
        } satisfies UpdateProgress),
      );

      // Spawn detached — survives parent exit
      const child = spawn('bash', [scriptPath], {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          ATLAS_HOME: atlasHome,
          ATLAS_PORT: String(process.env.PORT || '3100'),
        },
      });
      child.unref();

      // Give the HTTP response 500ms to flush, then graceful shutdown
      setTimeout(() => {
        logger.info(`${FILE_PATH} :: ${FUNCTION_NAME} - shutting down for update`);
        process.kill(process.pid, 'SIGTERM');
      }, 500);

      return { status: 'updating', startedAt };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to start update', { cause: error });
    }
  }

  /** Deletes all rows from every application table (children before parents). */
  resetDatabase(): void {
    const FUNCTION_NAME = 'resetDatabase';
    try {
      // --- Leaf tables (no dependents) ---
      db.delete(chatMessages).run();
      db.delete(usageLogs).run();
      db.delete(activityLog).run();
      db.delete(modelCache).run();
      db.delete(preferences).run();
      db.delete(heartbeatRuns).run();
      db.delete(pipelineTasks).run();
      db.delete(projectDocs).run();

      // --- Tables referencing agents / projects / tasks ---
      db.delete(chatConversations).run();
      db.delete(reviews).run();
      db.delete(quickActions).run();
      db.delete(agentProjects).run();
      db.delete(agentSkills).run();
      db.delete(agentRules).run();
      db.delete(skillRules).run();
      db.delete(dispatchRules).run();
      db.delete(heartbeatConfigs).run();
      db.delete(pipelines).run();
      db.delete(phases).run();
      db.delete(memory).run();
      db.delete(workspaces).run();

      // --- Core entity tables ---
      db.delete(tasks).run();
      db.delete(skills).run();
      db.delete(rules).run();
      db.delete(globalInstructions).run();
      db.delete(integrations).run();
      db.delete(mcpServers).run();
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
