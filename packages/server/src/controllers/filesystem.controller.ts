import type { Context } from 'hono';
import { filesystemService } from '../services/index.js';

/** Lists subdirectories of a path, indicating which are git repos. */
export function browseFilesystem(c: Context) {
  const result = filesystemService.browse(c.req.query('path'));
  return c.json(result);
}

/** Scans a directory for project metadata (name, tech stack, repo URL, etc.). */
export function scanFilesystem(c: Context) {
  const rawPath = c.req.query('path');
  if (!rawPath) {
    return c.json({ error: 'path query parameter is required' }, 400);
  }
  const result = filesystemService.scan(rawPath);
  return c.json(result);
}
