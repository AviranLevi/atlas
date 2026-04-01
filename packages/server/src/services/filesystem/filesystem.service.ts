// External
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Lib
import {
  type BrowseResponse,
  type DirectoryEntry,
  type ScanResult,
  detectCICD,
  detectDefaultBranch,
  detectDescription,
  detectMonorepo,
  detectName,
  detectPackageManager,
  detectRepoUrl,
  detectTechStack,
  parseGitHubInfo,
} from '../../lib/filesystem-scanner/index.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

export class FilesystemService {
  /** Lists subdirectories of a path, indicating which are git repos. */
  browse(rawPath?: string): BrowseResponse {
    const resolvedPath = path.resolve(rawPath || os.homedir());

    if (!fs.existsSync(resolvedPath)) {
      throw new AppError('Path does not exist', { status: 404 });
    }

    const stat = fs.statSync(resolvedPath);
    if (!stat.isDirectory()) {
      throw new AppError('Path is not a directory', { status: 400 });
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
    } catch (error: unknown) {
      logger.warn('filesystem.service :: browse readdirSync failed', error);
      entries = [];
    }

    const isGitRepo = fs.existsSync(path.join(resolvedPath, '.git'));

    return {
      currentPath: resolvedPath,
      parentPath: parentPath !== resolvedPath ? parentPath : null,
      directories: entries,
      isGitRepo,
    };
  }

  /** Scans a directory for project metadata (name, tech stack, repo URL, etc.). */
  scan(rawPath: string): ScanResult {
    const resolvedPath = path.resolve(rawPath);
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
      throw new AppError('Path does not exist or is not a directory', { status: 400 });
    }

    const repositoryUrl = detectRepoUrl(resolvedPath);
    const { owner: githubOwner, repo: githubRepo } = parseGitHubInfo(repositoryUrl);

    return {
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
  }
}
