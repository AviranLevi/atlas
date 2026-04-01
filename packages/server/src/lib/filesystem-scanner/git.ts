// External
import { execSync } from 'node:child_process';

/** Returns the git remote origin URL converted to HTTPS format. */
export function detectRepoUrl(dirPath: string): string | null {
  try {
    const url = execSync('git remote get-url origin', {
      cwd: dirPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();

    if (url.startsWith('git@')) {
      return url.replace(/^git@([^:]+):/, 'https://$1/').replace(/\.git$/, '');
    }
    return url.replace(/\.git$/, '');
  } catch {
    return null;
  }
}

/** Parses GitHub owner and repo name from a repository URL. */
export function parseGitHubInfo(repoUrl: string | null): { owner: string | null; repo: string | null } {
  if (!repoUrl) return { owner: null, repo: null };
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (match) return { owner: match[1], repo: match[2] };
  return { owner: null, repo: null };
}

/** Detects the default branch via symbolic ref or falls back to main/master. */
export function detectDefaultBranch(dirPath: string): string | null {
  try {
    const head = execSync('git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null', {
      cwd: dirPath,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    if (head) return head.replace('refs/remotes/origin/', '');
  } catch {
    // Fall through
  }
  try {
    execSync('git rev-parse --verify main', { cwd: dirPath, stdio: ['pipe', 'pipe', 'pipe'] });
    return 'main';
  } catch {
    try {
      execSync('git rev-parse --verify master', { cwd: dirPath, stdio: ['pipe', 'pipe', 'pipe'] });
      return 'master';
    } catch {
      return null;
    }
  }
}
