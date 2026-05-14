// External
import fs from 'node:fs';
import path from 'node:path';

const IGNORED_ENTRIES = new Set(['node_modules', '__pycache__']);

/** Recursively lists a directory up to `maxDepth` levels. Returns an error object if the path is invalid. */
export function listDirectory(dirPath: string, maxDepth: number, currentDepth = 0): unknown {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    return { error: 'Path does not exist or is not a directory' };
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((e) => !e.name.startsWith('.') && !IGNORED_ENTRIES.has(e.name))
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((e) => {
      const entry: Record<string, unknown> = {
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
      };
      if (e.isDirectory() && currentDepth < maxDepth - 1) {
        entry.children = listDirectory(path.join(dirPath, e.name), maxDepth, currentDepth + 1);
      }
      return entry;
    });
}
