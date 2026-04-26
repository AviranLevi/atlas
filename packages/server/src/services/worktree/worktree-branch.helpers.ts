// External
import { execSync } from 'node:child_process';

/** Detects the default branch (main/master) for a project. */
export function getDefaultBranch(projectLocalPath: string): string {
  try {
    const head = execSync('git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || echo ""', {
      cwd: projectLocalPath,
      encoding: 'utf-8',
    }).trim();
    if (head) {
      return head.replace('refs/remotes/origin/', '');
    }
  } catch {
    // Fall through to local-branch probe.
  }

  try {
    execSync('git rev-parse --verify main', { cwd: projectLocalPath, stdio: 'pipe' });
    return 'main';
  } catch {
    return 'master';
  }
}
