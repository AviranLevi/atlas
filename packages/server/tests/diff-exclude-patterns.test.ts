/**
 * Tests that DIFF_EXCLUDE_PATTERNS correctly filter file paths when used
 * with minimatch({ dot: true }). This is the authoritative exclusion layer
 * for getDiff — git pathspecs are NOT used because ** prefix in negative
 * pathspecs silently fails on top-level directories.
 *
 * This file does NOT use the global vi.mock for minimatch/child_process
 * because it needs real minimatch behavior.
 */
import { describe, it, expect } from 'vitest';
import { minimatch } from 'minimatch';
import { DIFF_EXCLUDE_PATTERNS } from '../src/services/worktree/worktree.constants.js';

// vi.mock for logger/errors from setup.ts is fine — we don't use them here.

const shouldExclude = (filepath: string) =>
  DIFF_EXCLUDE_PATTERNS.some((p) => minimatch(filepath, p, { dot: true }));

describe('DIFF_EXCLUDE_PATTERNS with minimatch({ dot: true })', () => {
  it('excludes node_modules/.bin symlinks (dotdir inside node_modules)', () => {
    expect(shouldExclude('node_modules/.bin/tsc')).toBe(true);
    expect(shouldExclude('node_modules/.bin/vitest')).toBe(true);
  });

  it('excludes node_modules/.package-lock.json (dotfile inside node_modules)', () => {
    expect(shouldExclude('node_modules/.package-lock.json')).toBe(true);
  });

  it('excludes node_modules/.vite nested paths', () => {
    expect(shouldExclude('node_modules/.vite/vitest/results.json')).toBe(true);
  });

  it('excludes regular node_modules paths', () => {
    expect(shouldExclude('node_modules/@adobe/css-tools/dist/index.js')).toBe(true);
    expect(shouldExclude('node_modules/lodash/lodash.js')).toBe(true);
  });

  it('excludes nested node_modules (monorepo packages)', () => {
    expect(shouldExclude('packages/app/node_modules/foo/index.js')).toBe(true);
  });

  it('excludes build artifact directories and their contents', () => {
    expect(shouldExclude('dist/bundle.js')).toBe(true);
    expect(shouldExclude('packages/app/dist/main.js')).toBe(true);
    expect(shouldExclude('.next/cache/webpack/abc123')).toBe(true);
    expect(shouldExclude('.nuxt/dist/server.js')).toBe(true);
    expect(shouldExclude('.turbo/cache/hash')).toBe(true);
  });

  it('excludes lockfiles at any depth', () => {
    expect(shouldExclude('pnpm-lock.yaml')).toBe(true);
    expect(shouldExclude('package-lock.json')).toBe(true);
    expect(shouldExclude('yarn.lock')).toBe(true);
    expect(shouldExclude('bun.lockb')).toBe(true);
    expect(shouldExclude('packages/web/pnpm-lock.yaml')).toBe(true);
  });

  it('does NOT exclude source files', () => {
    expect(shouldExclude('src/index.ts')).toBe(false);
    expect(shouldExclude('README.md')).toBe(false);
    expect(shouldExclude('package.json')).toBe(false);
    expect(shouldExclude('.gitignore')).toBe(false);
    expect(shouldExclude('src/components/App.tsx')).toBe(false);
  });
});
