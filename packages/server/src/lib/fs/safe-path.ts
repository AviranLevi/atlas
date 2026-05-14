// External
import path from 'node:path';

/** Returns true if `candidate` resolves to `root` or a path inside it. Prevents path traversal. */
export function isResolvedPathInsideRoot(root: string, candidate: string): boolean {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const prefix = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;
  return resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(prefix);
}
