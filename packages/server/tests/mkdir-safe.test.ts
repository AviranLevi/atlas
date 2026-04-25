import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { mkdirSafe } from '../src/lib/filesystem-scanner/mkdir-safe.js';

const TEST_ROOT = fs.realpathSync(os.tmpdir());

function freshTmp(): string {
  const dir = fs.mkdtempSync(path.join(TEST_ROOT, 'atlas-mkdir-safe-'));
  return fs.realpathSync(dir);
}

describe('mkdirSafe', () => {
  let tmp: string;
  let prevAllowed: string | undefined;

  beforeEach(() => {
    tmp = freshTmp();
    prevAllowed = process.env.ATLAS_ALLOWED_PARENT_ROOTS;
    process.env.ATLAS_ALLOWED_PARENT_ROOTS = tmp;
  });

  afterEach(() => {
    if (prevAllowed === undefined) delete process.env.ATLAS_ALLOWED_PARENT_ROOTS;
    else process.env.ATLAS_ALLOWED_PARENT_ROOTS = prevAllowed;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('creates a new folder inside an allowed root', () => {
    const result = mkdirSafe(tmp, 'my-project');
    expect(result).toBe(path.join(tmp, 'my-project'));
    expect(fs.statSync(result).isDirectory()).toBe(true);
  });

  it('rejects names containing path separators', () => {
    expect(() => mkdirSafe(tmp, '../escape')).toThrow(/separators/);
    expect(() => mkdirSafe(tmp, 'a/b')).toThrow(/separators/);
  });

  it('rejects empty, dot, and dot-dot names', () => {
    expect(() => mkdirSafe(tmp, '')).toThrow(/Invalid folder name/);
    expect(() => mkdirSafe(tmp, '.')).toThrow(/Invalid folder name/);
    expect(() => mkdirSafe(tmp, '..')).toThrow(/Invalid folder name/);
  });

  it('rejects reserved Windows names', () => {
    expect(() => mkdirSafe(tmp, 'CON')).toThrow(/reserved/);
    expect(() => mkdirSafe(tmp, 'lpt1')).toThrow(/reserved/);
  });

  it('rejects when target already exists', () => {
    fs.mkdirSync(path.join(tmp, 'already-here'));
    expect(() => mkdirSafe(tmp, 'already-here')).toThrow(/already exists/);
  });

  it('rejects parents outside allowed roots', () => {
    process.env.ATLAS_ALLOWED_PARENT_ROOTS = path.join(tmp, 'allowed-only');
    fs.mkdirSync(path.join(tmp, 'allowed-only'));
    expect(() => mkdirSafe(tmp, 'should-fail')).toThrow(/not inside an allowed root/);
  });

  it('rejects relative parent paths', () => {
    expect(() => mkdirSafe('relative/path', 'foo')).toThrow(/absolute/);
  });

  it('rejects parents that do not exist', () => {
    expect(() => mkdirSafe(path.join(tmp, 'nope'), 'foo')).toThrow(/does not exist/);
  });
});
