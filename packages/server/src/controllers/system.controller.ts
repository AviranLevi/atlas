// External
import type { Context } from 'hono';

// Shared
import type { ResetDatabase } from '@atlas/shared';

// Services
import { systemService } from '../services/index.js';

// Lib
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Returns server metadata and database file stats. */
export async function getSystemInfo(c: Context): Promise<Response> {
  return c.json(systemService.getInfo());
}

/** Checks GitHub releases for a newer version of Atlas. */
export async function getUpdateCheck(c: Context): Promise<Response> {
  return c.json(await systemService.checkForUpdates());
}

/** Streams the SQLite database file as a download. */
export async function exportDatabase(_c: Context): Promise<Response> {
  const { data, filename } = systemService.exportDatabase();
  return new Response(data.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/** Returns the current update progress from the progress file. */
export async function getUpdateProgress(c: Context): Promise<Response> {
  return c.json(systemService.getUpdateProgress());
}

/** Triggers a self-update. Returns 202 Accepted. */
export async function triggerUpdate(c: Context): Promise<Response> {
  return c.json(systemService.performUpdate(), 202);
}

/** Deletes all rows from every application table. Requires { confirm: true }. */
export async function resetDatabase(c: Context): Promise<Response> {
  getValidatedBody<ResetDatabase>(c);
  systemService.resetDatabase();
  return c.body(null, 204);
}
