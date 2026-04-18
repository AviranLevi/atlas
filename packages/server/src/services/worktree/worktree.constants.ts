export const WORKSPACES_DIR = '.agent-workspaces';

export const DIFF_EXCLUDE_PATTERNS = [
  'node_modules',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
  '.pnpm-store',
  'dist',
  '.next',
  '.nuxt',
  '.turbo',
];

export const DIFF_MAX_BUFFER = 50 * 1024 * 1024;
