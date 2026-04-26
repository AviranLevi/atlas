// External
import fs from 'node:fs';
import path from 'node:path';

// Lib
import { getAllowedParentRoots, isInsideAllowedRoot } from '../allowed-roots.js';
import { AppError } from '../errors.js';

const FORBIDDEN_NAMES = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]);

function validateName(name: string): void {
  if (!name || name === '.' || name === '..') {
    throw new AppError('Invalid folder name', { status: 400 });
  }
  if (name.includes('/') || name.includes('\\')) {
    throw new AppError('Folder name must not contain path separators', { status: 400 });
  }
  // biome-ignore lint/suspicious/noControlCharactersInRegex: This regex's purpose is to detect and reject control characters in folder names.
  if (/[\u0000-\u001f]/.test(name)) {
    throw new AppError('Folder name contains control characters', { status: 400 });
  }
  if (FORBIDDEN_NAMES.has(name.toUpperCase())) {
    throw new AppError(`"${name}" is a reserved name`, { status: 400 });
  }
}

/**
 * Safely creates `parent/name` after validating that the resolved target stays inside an
 * allowed root and the directory does not already exist. Returns the absolute path of the
 * newly-created folder.
 *
 * Throws `AppError` (400) on validation failures, (409) when the folder already exists.
 */
export function mkdirSafe(parent: string, name: string): string {
  if (!parent || !path.isAbsolute(parent)) {
    throw new AppError('Parent path must be absolute', { status: 400 });
  }
  validateName(name);

  let canonicalParent: string;
  try {
    canonicalParent = fs.realpathSync(parent);
  } catch {
    throw new AppError(`Parent folder does not exist: ${parent}`, { status: 400 });
  }

  const target = path.resolve(canonicalParent, name);
  // Reject if the resolved target escapes the canonical parent (defensive — name validation
  // already blocks separators, but this catches symlink shenanigans).
  if (path.dirname(target) !== canonicalParent) {
    throw new AppError('Target path resolves outside parent', { status: 400 });
  }

  const roots = getAllowedParentRoots();
  if (!isInsideAllowedRoot(canonicalParent, roots)) {
    throw new AppError(`Parent path is not inside an allowed root: ${canonicalParent}`, { status: 400 });
  }

  if (fs.existsSync(target)) {
    throw new AppError(`Folder already exists: ${target}`, { status: 409 });
  }

  fs.mkdirSync(target, { recursive: false });
  return target;
}
