// External
import fs from 'node:fs';
import path from 'node:path';

// Lib
import { isResolvedPathInsideRoot } from './safe-path.js';

/** 100 KB cap — avoids sending huge build artifacts to the LLM. */
const MAX_FILE_BYTES = 100_000;

/** Reads a file within a sandboxed root directory. Returns content or a structured error. */
export function readFileSafely(
  root: string,
  relativePath: string,
): { relativePath: string; content: string } | { error: string } {
  const fullPath = path.resolve(root, relativePath);
  if (!isResolvedPathInsideRoot(root, fullPath)) {
    return { error: 'Path traversal not allowed' };
  }
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return { error: `File not found: ${relativePath}` };
  }
  const stat = fs.statSync(fullPath);
  if (stat.size > MAX_FILE_BYTES) {
    return { error: `File is too large to read (${Math.round(stat.size / 1024)} KB). Read a specific range instead.` };
  }
  return { relativePath, content: fs.readFileSync(fullPath, 'utf-8') };
}
