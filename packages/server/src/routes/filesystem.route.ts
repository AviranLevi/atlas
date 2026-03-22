// NPM
import { Hono } from 'hono';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import type { ProjectScanData } from '@my-agents/shared';

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
  defaultBranch: string | null;
  packageManager: string | null;
  cicd: string | null;
  monorepo: boolean;
  githubOwner: string | null;
  githubRepo: string | null;
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

function parseGitHubInfo(repoUrl: string | null): { owner: string | null; repo: string | null } {
  if (!repoUrl) return { owner: null, repo: null };
  // Match https://github.com/owner/repo or similar patterns
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  if (match) return { owner: match[1], repo: match[2] };
  return { owner: null, repo: null };
}

function detectDefaultBranch(dirPath: string): string | null {
  try {
    // Try symbolic ref first
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

function detectPackageManager(dirPath: string): string | null {
  const exists = (f: string) => fs.existsSync(path.join(dirPath, f));
  if (exists('bun.lockb') || exists('bun.lock')) return 'bun';
  if (exists('pnpm-lock.yaml')) return 'pnpm';
  if (exists('yarn.lock')) return 'yarn';
  if (exists('package-lock.json')) return 'npm';
  if (exists('Cargo.lock')) return 'cargo';
  if (exists('go.sum')) return 'go';
  if (exists('poetry.lock')) return 'poetry';
  if (exists('Pipfile.lock')) return 'pipenv';
  if (exists('requirements.txt') || exists('setup.py')) return 'pip';
  if (exists('Gemfile.lock')) return 'bundler';
  return null;
}

function detectCICD(dirPath: string): string | null {
  const exists = (f: string) => fs.existsSync(path.join(dirPath, f));
  const ciSystems: string[] = [];
  if (exists('.github/workflows') && fs.statSync(path.join(dirPath, '.github/workflows')).isDirectory()) {
    ciSystems.push('GitHub Actions');
  }
  if (exists('.gitlab-ci.yml')) ciSystems.push('GitLab CI');
  if (exists('.circleci')) ciSystems.push('CircleCI');
  if (exists('Jenkinsfile')) ciSystems.push('Jenkins');
  if (exists('.travis.yml')) ciSystems.push('Travis CI');
  if (exists('vercel.json') || exists('.vercel')) ciSystems.push('Vercel');
  if (exists('netlify.toml')) ciSystems.push('Netlify');
  return ciSystems.length > 0 ? ciSystems.join(', ') : null;
}

function detectMonorepo(dirPath: string): boolean {
  const pkg = readJsonFile(path.join(dirPath, 'package.json'));
  if (pkg?.workspaces) return true;
  const exists = (f: string) => fs.existsSync(path.join(dirPath, f));
  if (exists('pnpm-workspace.yaml')) return true;
  if (exists('lerna.json')) return true;
  if (exists('nx.json')) return true;
  if (exists('turbo.json')) return true;
  return false;
}

// ─── Deep scan helpers ────────────────────────────────────────────────────

function detectProjectType(dirPath: string): ProjectScanData['projectType'] {
  const pkg = readJsonFile(path.join(dirPath, 'package.json'));
  const allDeps = {
    ...(pkg?.dependencies as Record<string, string> | undefined),
    ...(pkg?.devDependencies as Record<string, string> | undefined),
  };
  const depNames = Object.keys(allDeps);

  const hasFrontend = depNames.some((d) =>
    ['react', 'vue', 'svelte', '@angular/core', 'next', 'nuxt', 'solid-js', 'lit'].includes(d)
  );
  const hasBackend = depNames.some((d) =>
    ['express', 'fastify', 'hono', 'koa', '@nestjs/core', 'hapi', 'restify'].includes(d)
  );
  const exists = (f: string) => fs.existsSync(path.join(dirPath, f));

  // Mobile
  if (depNames.includes('react-native') || depNames.includes('expo') || exists('android') || exists('ios')) {
    return 'mobile';
  }

  // CLI
  if (pkg?.bin || depNames.some((d) => ['commander', 'yargs', 'meow', 'inquirer', 'clap'].includes(d))) {
    if (!hasFrontend && !hasBackend) return 'cli';
  }

  // Library (has main/exports/types but no frontend/backend framework)
  if ((pkg?.main || pkg?.exports || pkg?.types) && !hasFrontend && !hasBackend) {
    return 'library';
  }

  if (hasFrontend && hasBackend) return 'fullstack';
  if (hasFrontend) return 'frontend';
  if (hasBackend) return 'backend';

  // Language-level fallbacks
  if (exists('Cargo.toml') || exists('go.mod') || exists('requirements.txt') || exists('pyproject.toml')) {
    return 'backend';
  }

  return 'other';
}

function detectLanguages(dirPath: string): string[] {
  const langs: string[] = [];
  const exists = (f: string) => fs.existsSync(path.join(dirPath, f));

  if (exists('tsconfig.json') || exists('tsconfig.base.json')) langs.push('TypeScript');
  if (exists('package.json') && !langs.includes('TypeScript')) langs.push('JavaScript');
  if (exists('Cargo.toml')) langs.push('Rust');
  if (exists('go.mod')) langs.push('Go');
  if (exists('requirements.txt') || exists('pyproject.toml') || exists('setup.py')) langs.push('Python');
  if (exists('Gemfile')) langs.push('Ruby');
  if (exists('pom.xml') || exists('build.gradle') || exists('build.gradle.kts')) langs.push('Java');
  if (exists('Package.swift')) langs.push('Swift');
  if (exists('pubspec.yaml')) langs.push('Dart');

  // Check for CSS/HTML
  if (exists('tailwind.config.ts') || exists('tailwind.config.js') || exists('postcss.config.js')) {
    langs.push('CSS');
  }

  return langs;
}

function detectDependencies(dirPath: string): { deps: string[]; devDeps: string[] } {
  const pkg = readJsonFile(path.join(dirPath, 'package.json'));
  const deps = pkg?.dependencies ? Object.keys(pkg.dependencies as Record<string, string>) : [];
  const devDeps = pkg?.devDependencies ? Object.keys(pkg.devDependencies as Record<string, string>) : [];
  return { deps, devDeps };
}

function detectEnvVars(dirPath: string): string[] {
  const envVars: Set<string> = new Set();

  // Check .env.example, .env.sample, .env.template
  for (const name of ['.env.example', '.env.sample', '.env.template', '.env.local.example']) {
    const envPath = path.join(dirPath, name);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=/);
          if (match) envVars.add(match[1]);
        }
      }
    }
  }

  // Check docker-compose for env references
  for (const name of ['docker-compose.yml', 'docker-compose.yaml']) {
    const dcPath = path.join(dirPath, name);
    if (fs.existsSync(dcPath)) {
      const content = fs.readFileSync(dcPath, 'utf-8');
      const matches = content.matchAll(/\$\{([A-Z_][A-Z0-9_]*)/g);
      for (const m of matches) envVars.add(m[1]);
    }
  }

  return [...envVars].sort();
}

function detectKeyDirectories(dirPath: string): Record<string, string> {
  const dirs: Record<string, string> = {};
  const check = (label: string, ...candidates: string[]) => {
    for (const c of candidates) {
      const full = path.join(dirPath, c);
      if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
        dirs[label] = c;
        return;
      }
    }
  };

  check('source', 'src', 'lib', 'app', 'source');
  check('components', 'src/components', 'components', 'src/ui', 'app/components');
  check('pages', 'src/pages', 'pages', 'app', 'src/app', 'src/routes');
  check('api', 'src/api', 'api', 'src/routes', 'src/controllers', 'routes');
  check('tests', 'tests', 'test', '__tests__', 'spec', 'src/__tests__');
  check('docs', 'docs', 'documentation', 'doc');
  check('public', 'public', 'static', 'assets');
  check('config', 'config', '.config', 'conf');
  check('database', 'src/db', 'db', 'database', 'prisma', 'drizzle', 'migrations', 'src/database');

  return dirs;
}

function detectPorts(dirPath: string): number[] {
  const ports: Set<number> = new Set();

  // Check package.json scripts for port hints
  const pkg = readJsonFile(path.join(dirPath, 'package.json'));
  const scripts = (pkg?.scripts ?? {}) as Record<string, string>;
  for (const script of Object.values(scripts)) {
    const portMatch = script.match(/(?:--port|PORT=|-p\s+)(\d{4,5})/);
    if (portMatch) ports.add(parseInt(portMatch[1]));
  }

  // Check common config files for port
  const configFiles = [
    'vite.config.ts', 'vite.config.js',
    'next.config.js', 'next.config.mjs', 'next.config.ts',
    'nuxt.config.ts', 'nuxt.config.js',
    'webpack.config.js',
  ];
  for (const cf of configFiles) {
    const cfPath = path.join(dirPath, cf);
    if (fs.existsSync(cfPath)) {
      try {
        const content = fs.readFileSync(cfPath, 'utf-8');
        const portMatches = content.matchAll(/port\s*[:=]\s*(\d{4,5})/gi);
        for (const m of portMatches) ports.add(parseInt(m[1]));
      } catch { /* ignore */ }
    }
  }

  // Check .env files for PORT
  for (const envName of ['.env', '.env.local', '.env.development', '.env.example']) {
    const envPath = path.join(dirPath, envName);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(/^PORT\s*=\s*(\d{4,5})/m);
        if (match) ports.add(parseInt(match[1]));
      } catch { /* ignore */ }
    }
  }

  return [...ports].sort();
}

function detectFormatting(dirPath: string): ProjectScanData['formatting'] {
  const exists = (f: string) => fs.existsSync(path.join(dirPath, f));
  const result: NonNullable<ProjectScanData['formatting']> = {};

  // Prettier
  const prettierFiles = ['.prettierrc', '.prettierrc.json', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.yaml', '.prettierrc.yml', '.prettierrc.toml', 'prettier.config.js', 'prettier.config.cjs'];
  result.prettier = prettierFiles.some(exists);

  // Try to read prettier config
  if (result.prettier) {
    for (const pf of ['.prettierrc', '.prettierrc.json']) {
      const pfPath = path.join(dirPath, pf);
      if (fs.existsSync(pfPath)) {
        try {
          result.config = { prettier: JSON.parse(fs.readFileSync(pfPath, 'utf-8')) };
        } catch { /* ignore */ }
        break;
      }
    }
  }

  // ESLint
  const eslintFiles = ['.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.yaml', '.eslintrc.yml', 'eslint.config.js', 'eslint.config.mjs', 'eslint.config.ts'];
  result.eslint = eslintFiles.some(exists);

  // EditorConfig
  result.editorconfig = exists('.editorconfig');

  // Biome
  result.biome = exists('biome.json') || exists('biome.jsonc');

  return result;
}

function detectScripts(dirPath: string): Record<string, string> {
  const pkg = readJsonFile(path.join(dirPath, 'package.json'));
  if (!pkg?.scripts) return {};

  const scripts = pkg.scripts as Record<string, string>;
  // Only include the most useful scripts
  const important = ['dev', 'start', 'build', 'test', 'lint', 'format', 'typecheck', 'preview', 'serve', 'watch', 'clean', 'deploy'];
  const result: Record<string, string> = {};
  for (const key of important) {
    if (scripts[key]) result[key] = scripts[key];
  }
  return result;
}

/** Performs a deep scan and returns the full ProjectScanData */
export function deepScanProject(dirPath: string): ProjectScanData {
  const repositoryUrl = detectRepoUrl(dirPath);
  const { owner: githubOwner, repo: githubRepo } = parseGitHubInfo(repositoryUrl);
  const { deps, devDeps } = detectDependencies(dirPath);

  return {
    projectType: detectProjectType(dirPath),
    languages: detectLanguages(dirPath),
    dependencies: deps,
    devDependencies: devDeps,
    envVars: detectEnvVars(dirPath),
    keyDirectories: detectKeyDirectories(dirPath),
    ports: detectPorts(dirPath),
    formatting: detectFormatting(dirPath),
    packageManager: detectPackageManager(dirPath),
    cicd: detectCICD(dirPath),
    monorepo: detectMonorepo(dirPath),
    githubOwner,
    githubRepo,
    scripts: detectScripts(dirPath),
    scannedAt: new Date().toISOString(),
  };
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
  });
