// External
import os from 'node:os';
import path from 'node:path';

function expandHome(p: string): string {
  if (p === '~' || p.startsWith('~/')) return path.join(os.homedir(), p.slice(p === '~' ? 1 : 2));
  return p;
}

/**
 * Returns the list of canonical absolute paths the scaffold endpoint is allowed to create
 * folders inside. Configured via `ATLAS_ALLOWED_PARENT_ROOTS` (colon-separated). Falls back
 * to a sane local-dev default: home + common dev directories + /tmp.
 */
export function getAllowedParentRoots(): string[] {
  const env = process.env.ATLAS_ALLOWED_PARENT_ROOTS;
  if (env) {
    return env
      .split(':')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => path.resolve(expandHome(p)));
  }

  const home = os.homedir();
  return [
    home,
    path.join(home, 'Documents'),
    path.join(home, 'code'),
    path.join(home, 'dev'),
    path.join(home, 'Projects'),
    '/tmp',
  ];
}

/**
 * Returns true when `candidate` is equal to or a descendant of any allowed root.
 * Both sides must be absolute, canonical paths (callers should `fs.realpathSync` first).
 */
export function isInsideAllowedRoot(candidate: string, roots: string[] = getAllowedParentRoots()): boolean {
  if (!path.isAbsolute(candidate)) return false;
  const normalized = path.resolve(candidate);
  return roots.some((root) => {
    const r = path.resolve(root);
    return normalized === r || normalized.startsWith(`${r}${path.sep}`);
  });
}
