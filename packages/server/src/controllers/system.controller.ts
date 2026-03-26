import type { Context } from 'hono';
import { systemService } from '../services/index.js';

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

/** Deletes all rows from every application table. */
export async function resetDatabase(c: Context): Promise<Response> {
  systemService.resetDatabase();
  return c.body(null, 204);
}
