// NPM
import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

type DirectoryEntry = {
  name: string;
  path: string;
  isGitRepo: boolean;
};

type BrowseResponse = {
  currentPath: string;
  parentPath: string | null;
  directories: DirectoryEntry[];
  isGitRepo: boolean;
};

type ScanResult = {
  name: string | null;
  description: string | null;
  techStack: string | null;
  repositoryUrl: string | null;
};

function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function detectName(dirPath: string): string | null {
  const pkg = readJsonFile(path.join(dirPath, 'package.json'));
  if (pkg?.name && typeof pkg.name === 'string') return pkg.name;

  const cargo = readTomlName(path.join(dirPath, 'Cargo.toml'));
  if (cargo) return cargo;

  const pyproject = readTomlName(path.join(dirPath, 'pyproject.toml'));
  if (pyproject) return pyproject;

  return path.basename(dirPath);
}

function readTomlName(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^name\s*=\s*"([^"]+)"/m);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function detectDescription(dirPath: string): string | null {
  const pkg = readJsonFile(path.join(dirPath, 'package.json'));
  if (pkg?.description && typeof pkg.description === 'string') return pkg.description;

  const readmePaths = ['README.md', 'readme.md', 'Readme.md'];
  for (const name of readmePaths) {
    const readmePath = path.join(dirPath, name);
    if (fs.existsSync(readmePath)) {
      const lines = fs.readFileSync(readmePath, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.replace(/^#+\s*/, '').trim();
        if (trimmed && trimmed.length > 10 && !trimmed.startsWith('#')) {
          return trimmed.slice(0, 200);
        }
      }
    }
  }

  return null;
}

function detectTechStack(dirPath: string): string | null {
  const techs: string[] = [];
  const exists = (f: string) => fs.existsSync(path.join(dirPath, f));

  if (exists('tsconfig.json') || exists('tsconfig.base.json')) techs.push('TypeScript');
  else if (exists('package.json')) techs.push('JavaScript');

  if (exists('package.json')) {
    const pkg = readJsonFile(path.join(dirPath, 'package.json'));
    const allDeps = {
      ...(pkg?.dependencies as Record<string, string> | undefined),
      ...(pkg?.devDependencies as Record<string, string> | undefined),
    };
    const depNames = Object.keys(allDeps);

    if (depNames.some((d) => d === 'next')) techs.push('Next.js');
    else if (depNames.some((d) => d === 'react')) techs.push('React');
    if (depNames.some((d) => d === 'vue')) techs.push('Vue');
    if (depNames.some((d) => d === '@angular/core')) techs.push('Angular');
    if (depNames.some((d) => d === 'svelte')) techs.push('Svelte');
    if (depNames.some((d) => d === 'hono')) techs.push('Hono');
    if (depNames.some((d) => d === 'express')) techs.push('Express');
    if (depNames.some((d) => d === 'fastify')) techs.push('Fastify');
    if (depNames.some((d) => d === 'drizzle-orm')) techs.push('Drizzle');
    if (depNames.some((d) => d === 'prisma' || d === '@prisma/client')) techs.push('Prisma');
    if (depNames.some((d) => d === 'tailwindcss')) techs.push('Tailwind CSS');
    if (depNames.some((d) => d === 'vite')) techs.push('Vite');
    if (depNames.some((d) => d === 'electron')) techs.push('Electron');
    if (depNames.some((d) => d.includes('sqlite') || d === 'better-sqlite3')) techs.push('SQLite');
    if (depNames.some((d) => d === 'pg' || d === 'postgres')) techs.push('PostgreSQL');
    if (depNames.some((d) => d === 'mongoose' || d === 'mongodb')) techs.push('MongoDB');
  }

  if (exists('Cargo.toml')) techs.push('Rust');
  if (exists('go.mod')) techs.push('Go');
  if (exists('requirements.txt') || exists('pyproject.toml') || exists('setup.py')) techs.push('Python');
  if (exists('Gemfile')) techs.push('Ruby');
  if (exists('pom.xml') || exists('build.gradle') || exists('build.gradle.kts')) techs.push('Java');
  if (exists('*.csproj') || exists('*.sln')) techs.push('C#');
  if (exists('docker-compose.yml') || exists('docker-compose.yaml') || exists('Dockerfile')) techs.push('Docker');

  return techs.length > 0 ? techs.join(', ') : null;
}

function detectRepoUrl(dirPath: string): string | null {
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

export const filesystemRoute = new Hono()
  .get('/browse', (c) => {
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
  })
  .get('/scan', (c) => {
    const rawPath = c.req.query('path');
    if (!rawPath) {
      return c.json({ error: 'path query parameter is required' }, 400);
    }

    const resolvedPath = path.resolve(rawPath);
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
      return c.json({ error: 'Path does not exist or is not a directory' }, 400);
    }

    const result: ScanResult = {
      name: detectName(resolvedPath),
      description: detectDescription(resolvedPath),
      techStack: detectTechStack(resolvedPath),
      repositoryUrl: detectRepoUrl(resolvedPath),
    };

    return c.json(result);
  });
