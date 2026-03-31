// External
import fs from 'fs';
import path from 'path';

// Shared
import type { ProjectScanData } from '@atlas/shared';

// Lib
import { readJsonFile } from './detectors.js';
import { detectRepoUrl, parseGitHubInfo } from './git.js';
import { detectPackageManager, detectCICD, detectMonorepo } from './detectors.js';

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

  if (depNames.includes('react-native') || depNames.includes('expo') || exists('android') || exists('ios')) {
    return 'mobile';
  }

  if (pkg?.bin || depNames.some((d) => ['commander', 'yargs', 'meow', 'inquirer', 'clap'].includes(d))) {
    if (!hasFrontend && !hasBackend) return 'cli';
  }

  if ((pkg?.main || pkg?.exports || pkg?.types) && !hasFrontend && !hasBackend) {
    return 'library';
  }

  if (hasFrontend && hasBackend) return 'fullstack';
  if (hasFrontend) return 'frontend';
  if (hasBackend) return 'backend';

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

  const pkg = readJsonFile(path.join(dirPath, 'package.json'));
  const scripts = (pkg?.scripts ?? {}) as Record<string, string>;
  for (const script of Object.values(scripts)) {
    const portMatch = script.match(/(?:--port|PORT=|-p\s+)(\d{4,5})/);
    if (portMatch) ports.add(parseInt(portMatch[1]));
  }

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

  const prettierFiles = ['.prettierrc', '.prettierrc.json', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.yaml', '.prettierrc.yml', '.prettierrc.toml', 'prettier.config.js', 'prettier.config.cjs'];
  result.prettier = prettierFiles.some(exists);

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

  const eslintFiles = ['.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.yaml', '.eslintrc.yml', 'eslint.config.js', 'eslint.config.mjs', 'eslint.config.ts'];
  result.eslint = eslintFiles.some(exists);

  result.editorconfig = exists('.editorconfig');
  result.biome = exists('biome.json') || exists('biome.jsonc');

  return result;
}

function detectScripts(dirPath: string): Record<string, string> {
  const pkg = readJsonFile(path.join(dirPath, 'package.json'));
  if (!pkg?.scripts) return {};

  const scripts = pkg.scripts as Record<string, string>;
  const important = ['dev', 'start', 'build', 'test', 'lint', 'format', 'typecheck', 'preview', 'serve', 'watch', 'clean', 'deploy'];
  const result: Record<string, string> = {};
  for (const key of important) {
    if (scripts[key]) result[key] = scripts[key];
  }
  return result;
}

type AiConfigFile = {
  source: string;
  filePath: string;
  name: string;
  content: string;
};

const AI_CONFIG_SOURCES: Array<{
  source: string;
  paths: string[];
  glob?: string;
}> = [
  { source: 'cursor', paths: ['.cursor/rules'], glob: '*.{mdc,md}' },
  { source: 'cursor', paths: ['.cursorrules'] },
  { source: 'claude', paths: ['CLAUDE.md', '.claude/CLAUDE.md'] },
  { source: 'generic', paths: ['AGENTS.md'] },
  { source: 'copilot', paths: ['.github/copilot-instructions.md'] },
  { source: 'cline', paths: ['.clinerules'] },
  { source: 'cline', paths: ['.clinerules'], glob: '*.md' },
];

function parseMdcFrontmatter(content: string): string | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  const descLine = match[1].split('\n').find((l) => l.startsWith('description:'));
  return descLine ? descLine.replace('description:', '').trim() : null;
}

function detectAiConfigs(dirPath: string): AiConfigFile[] {
  const configs: AiConfigFile[] = [];

  for (const entry of AI_CONFIG_SOURCES) {
    for (const p of entry.paths) {
      const fullPath = path.join(dirPath, p);
      if (!fs.existsSync(fullPath)) continue;

      const stat = fs.statSync(fullPath);

      if (stat.isFile()) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8').trim();
          if (!content) continue;
          const baseName = path.basename(p, path.extname(p));
          configs.push({
            source: entry.source,
            filePath: p,
            name: baseName,
            content,
          });
        } catch { /* skip unreadable files */ }
      } else if (stat.isDirectory() && entry.glob) {
        try {
          const extensions = entry.glob.replace('*.{', '').replace('}', '').split(',');
          const files = fs.readdirSync(fullPath)
            .filter((f) => extensions.some((ext) => f.endsWith(`.${ext}`)));

          for (const file of files) {
            try {
              const filePath = path.join(p, file);
              const content = fs.readFileSync(path.join(dirPath, filePath), 'utf-8').trim();
              if (!content) continue;
              const baseName = path.basename(file, path.extname(file));
              const frontmatterName = file.endsWith('.mdc') ? parseMdcFrontmatter(content) : null;
              configs.push({
                source: entry.source,
                filePath: filePath,
                name: frontmatterName || baseName,
                content,
              });
            } catch { /* skip unreadable files */ }
          }
        } catch { /* skip unreadable dirs */ }
      }
    }
  }

  return configs;
}

/** Performs a deep scan of a project directory and returns the full ProjectScanData. */
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
    aiConfigs: detectAiConfigs(dirPath),
    scannedAt: new Date().toISOString(),
  };
}
