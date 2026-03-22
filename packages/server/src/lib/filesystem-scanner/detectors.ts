// External
import fs from 'fs';
import path from 'path';

/** Reads and parses a JSON file, returning null on any error. */
export function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

/** Extracts the name field from a TOML file, returning null on any error. */
export function readTomlName(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/^name\s*=\s*"([^"]+)"/m);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/** Detects the project name from package.json, Cargo.toml, or pyproject.toml. */
export function detectName(dirPath: string): string | null {
  const pkg = readJsonFile(path.join(dirPath, 'package.json'));
  if (pkg?.name && typeof pkg.name === 'string') return pkg.name;

  const cargo = readTomlName(path.join(dirPath, 'Cargo.toml'));
  if (cargo) return cargo;

  const pyproject = readTomlName(path.join(dirPath, 'pyproject.toml'));
  if (pyproject) return pyproject;

  return path.basename(dirPath);
}

/** Detects a project description from package.json or the first README paragraph. */
export function detectDescription(dirPath: string): string | null {
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

/** Detects the technology stack from config files and package dependencies. */
export function detectTechStack(dirPath: string): string | null {
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

/** Detects the package manager from lock files. */
export function detectPackageManager(dirPath: string): string | null {
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

/** Detects CI/CD systems from their config files. */
export function detectCICD(dirPath: string): string | null {
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

/** Returns true if the directory is a monorepo (pnpm workspace, Lerna, Nx, etc.). */
export function detectMonorepo(dirPath: string): boolean {
  const pkg = readJsonFile(path.join(dirPath, 'package.json'));
  if (pkg?.workspaces) return true;
  const exists = (f: string) => fs.existsSync(path.join(dirPath, f));
  if (exists('pnpm-workspace.yaml')) return true;
  if (exists('lerna.json')) return true;
  if (exists('nx.json')) return true;
  if (exists('turbo.json')) return true;
  return false;
}
