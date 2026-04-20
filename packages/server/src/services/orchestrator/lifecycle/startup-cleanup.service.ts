// External
import fs from 'node:fs';
import path from 'node:path';

// Lib
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'services/orchestrator/lifecycle/startup-cleanup.service.ts';
const OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'workspace-logs');
const RAW_LOG_RETENTION_DAYS = 7;
const RAW_LOG_RETENTION_MS = RAW_LOG_RETENTION_DAYS * 24 * 3600 * 1000;
const DAILY_INTERVAL_MS = 24 * 3600 * 1000;

/**
 * Periodic disk cleanup, intentionally decoupled from reconcileOnStartup.
 *
 * reconcileOnStartup fires every server boot (including dev restarts many
 * times per hour). This service runs once on boot and then on a daily
 * interval — regardless of how many times the server restarts.
 *
 * Today it only prunes stream-json raw debug logs older than 7 days. New
 * retention rules should live here rather than being bolted onto reconcile.
 */
export class StartupCleanupService {
  /** Sweep `data/workspace-logs/*.raw.log` and delete files older than the retention window. */
  runNow(): void {
    const FUNCTION_NAME = 'runNow';
    try {
      if (!fs.existsSync(OUTPUT_DIR)) return;
      const files = fs.readdirSync(OUTPUT_DIR);
      const cutoff = Date.now() - RAW_LOG_RETENTION_MS;
      let purged = 0;
      for (const filename of files) {
        if (!filename.endsWith('.raw.log')) continue;
        const full = path.join(OUTPUT_DIR, filename);
        try {
          const stat = fs.statSync(full);
          if (stat.mtime.getTime() < cutoff) {
            fs.unlinkSync(full);
            purged += 1;
          }
        } catch (err) {
          logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - failed to inspect ${filename}`, err);
        }
      }
      if (purged > 0) {
        logger.info(
          `${FILE_PATH} :: ${FUNCTION_NAME} - purged ${purged} raw log file(s) older than ${RAW_LOG_RETENTION_DAYS} days`,
        );
      }
    } catch (err) {
      logger.warn(`${FILE_PATH} :: ${FUNCTION_NAME} - sweep failed (non-fatal)`, err);
    }
  }

  /** Kicks off a daily re-run; returns the interval handle so the caller can clearInterval on shutdown. */
  scheduleDaily(): NodeJS.Timeout {
    const iv = setInterval(() => this.runNow(), DAILY_INTERVAL_MS);
    iv.unref();
    return iv;
  }
}

export const startupCleanupService = new StartupCleanupService();
