import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { gitInit } from '../src/lib/filesystem-scanner/git.js';

const TEST_ROOT = fs.realpathSync(os.tmpdir());

describe('gitInit', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.realpathSync(fs.mkdtempSync(path.join(TEST_ROOT, 'atlas-git-init-')));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('initializes a git repo with HEAD pointing at the requested branch', () => {
    gitInit(tmp, 'main');
    expect(fs.existsSync(path.join(tmp, '.git'))).toBe(true);

    const head = execSync('git symbolic-ref HEAD', { cwd: tmp, encoding: 'utf-8' }).trim();
    expect(head).toBe('refs/heads/main');
  });

  it('supports custom initial branch names', () => {
    gitInit(tmp, 'trunk');
    const head = execSync('git symbolic-ref HEAD', { cwd: tmp, encoding: 'utf-8' }).trim();
    expect(head).toBe('refs/heads/trunk');
  });

  it('produces a repo with no commits but a valid log surface', () => {
    gitInit(tmp, 'main');
    // `git log` on an empty repo exits non-zero with the "no commits yet" message.
    let stderr = '';
    try {
      execSync('git log', { cwd: tmp, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e) {
      stderr = String((e as { stderr?: Buffer }).stderr ?? '');
    }
    expect(stderr.toLowerCase()).toMatch(/does not have any commits|no commits/);
  });
});
