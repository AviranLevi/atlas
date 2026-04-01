import type { Context } from 'hono';
import { systemService } from '../services/index.js';
import { getValidatedBody } from '../lib/hono-helpers.js';
import type { ResetDatabase } from '@atlas/shared';

/** Returns server metadata and database file stats. */
export async function getSystemInfo(c: Context): Promise<Response> {
  return c.json(systemService.getInfo());
}

/** Streams the SQLite database file as a download. */
export async function exportDatabase(c: Context): Promise<Response> {
  const { data, filename } = systemService.exportDatabase();
  return new Response(data.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

/** Deletes all rows from every application table. Requires { confirm: true }. */
export async function resetDatabase(c: Context): Promise<Response> {
  getValidatedBody<ResetDatabase>(c);
  systemService.resetDatabase();
  return c.body(null, 204);
}
