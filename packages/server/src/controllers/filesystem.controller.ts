// External
import type { Context } from 'hono';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Lib
import {
  detectName,
  detectDescription,
  detectTechStack,
  detectRepoUrl,
  detectDefaultBranch,
  detectPackageManager,
  detectCICD,
  detectMonorepo,
  parseGitHubInfo,
  type BrowseResponse,
  type DirectoryEntry,
  type ScanResult,
} from '../lib/filesystem-scanner/index.js';

/** Lists subdirectories of a path, indicating which are git repos. */
export function browseFilesystem(c: Context) {
  const rawPath = c.req.query('path') || os.homedir();
  const resolvedPath = path.resolve(rawPath);

  if (!fs.existsSync(resolvedPath)) {
    return c.json({ error: 'Path does not exist' }, 404);
  }

  const stat = fs.statSync(resolvedPath);
  if (!stat.isDirectory()) {
    return c.json({ error: 'Path is not a directory' }, 400);
  }

  const parentPath = path.dirname(resolvedPath);

  let entries: DirectoryEntry[];
  try {
    const items = fs.readdirSync(resolvedPath, { withFileTypes: true });
    entries = items
      .filter((item) => item.isDirectory() && !item.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => {
        const fullPath = path.join(resolvedPath, item.name);
        const isGitRepo = fs.existsSync(path.join(fullPath, '.git'));
        return { name: item.name, path: fullPath, isGitRepo };
      });
  } catch {
    entries = [];
  }

  const isGitRepo = fs.existsSync(path.join(resolvedPath, '.git'));

  const response: BrowseResponse = {
    currentPath: resolvedPath,
    parentPath: parentPath !== resolvedPath ? parentPath : null,
    directories: entries,
    isGitRepo,
  };

  return c.json(response);
}

/** Scans a directory for project metadata (name, tech stack, repo URL, etc.). */
export function scanFilesystem(c: Context) {
  const rawPath = c.req.query('path');
  if (!rawPath) {
    return c.json({ error: 'path query parameter is required' }, 400);
  }

  const resolvedPath = path.resolve(rawPath);
  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
    return c.json({ error: 'Path does not exist or is not a directory' }, 400);
  }

  const repositoryUrl = detectRepoUrl(resolvedPath);
  const { owner: githubOwner, repo: githubRepo } = parseGitHubInfo(repositoryUrl);

  const result: ScanResult = {
    name: detectName(resolvedPath),
    description: detectDescription(resolvedPath),
    techStack: detectTechStack(resolvedPath),
    repositoryUrl,
    defaultBranch: detectDefaultBranch(resolvedPath),
    packageManager: detectPackageManager(resolvedPath),
    cicd: detectCICD(resolvedPath),
    monorepo: detectMonorepo(resolvedPath),
    githubOwner,
    githubRepo,
  };

  return c.json(result);
}
