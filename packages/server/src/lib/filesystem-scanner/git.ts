// External
import { execSync } from 'node:child_process';

// Lib
import { AppError } from '../errors.js';

/**
 * Initializes a git repo at `dirPath` with the given branch as HEAD. Uses the portable
 * `git init && git symbolic-ref HEAD refs/heads/<branch>` pair so we don't require git
 * ≥ 2.28 (which introduced `git init -b`).
 */
export function gitInit(dirPath: string, branch: string): void {
  try {
    execSync('git init', { cwd: dirPath, stdio: ['pipe', 'pipe', 'pipe'] });
    execSync(`git symbolic-ref HEAD refs/heads/${branch}`, {
      cwd: dirPath,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code === 'ENOENT') {
      throw new AppError('Git is required to initialize a repository — please install git', {
        status: 500,
        cause: error,
      });
    }
    throw new AppError('Failed to initialize git repository', { status: 500, cause: error });
  }
}

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
