import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PER_FILE_LINE_CAP } from '../src/services/worktree/worktree.constants.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
  execFileSync: vi.fn(),
}));

vi.mock('minimatch', () => ({
  minimatch: vi.fn(() => false),
}));

describe('WorktreeService.getDiff', () => {
  let WorktreeService: typeof import('../src/services/worktree/worktree.service.js').WorktreeService;
  let execFileSync: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();

    const cp = await import('node:child_process');
    execFileSync = cp.execFileSync as unknown as ReturnType<typeof vi.fn>;

    const mod = await import('../src/services/worktree/worktree.service.js');
    WorktreeService = mod.WorktreeService;
  });

  it('marks files exceeding PER_FILE_LINE_CAP as truncated', () => {
    const service = new WorktreeService();
    vi.spyOn(service, 'getDefaultBranch').mockReturnValue('main');

    const bigLines = PER_FILE_LINE_CAP + 1000;

    execFileSync.mockReturnValueOnce(`big-generated.sql\0src/index.ts\0`);
    execFileSync.mockReturnValueOnce(`${bigLines}\t0\tbig-generated.sql\n10\t2\tsrc/index.ts`);
    execFileSync.mockReturnValueOnce(
      'diff --git a/src/index.ts b/src/index.ts\nindex abc..def 100644\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,2 +1,10 @@\n+hello\n',
    );

    const result = service.getDiff('/fake/worktree', '/fake/project');

    expect(result.files).toHaveLength(2);

    const bigFile = result.files.find((f) => f.filename === 'big-generated.sql')!;
    expect(bigFile.truncated).toBe(true);
    expect(bigFile.patch).toBeUndefined();
    expect(bigFile.additions).toBe(bigLines);

    const normalFile = result.files.find((f) => f.filename === 'src/index.ts')!;
    expect(normalFile.truncated).toBeUndefined();

    expect(result.summary.filesChanged).toBe(2);
    expect(result.summary.additions).toBe(bigLines + 10);
  });

  it('returns empty result when all files are excluded', async () => {
    const minimatchMod = await import('minimatch');
    const mockMinimatch = minimatchMod.minimatch as unknown as ReturnType<typeof vi.fn>;
    mockMinimatch.mockReturnValue(true);

    const service = new WorktreeService();
    vi.spyOn(service, 'getDefaultBranch').mockReturnValue('main');

    execFileSync.mockReturnValueOnce(`node_modules/foo.js\0`);

    const result = service.getDiff('/fake/worktree', '/fake/project');
    expect(result.files).toHaveLength(0);
    expect(result.summary.filesChanged).toBe(0);
  });

  it('throws AppError with status 413 on maxBuffer overflow', () => {
    const service = new WorktreeService();
    vi.spyOn(service, 'getDefaultBranch').mockReturnValue('main');

    const bufferError = new RangeError('stdout maxBuffer length exceeded');
    execFileSync.mockImplementation(() => {
      throw bufferError;
    });

    try {
      service.getDiff('/fake/worktree', '/fake/project');
      expect.unreachable('should have thrown');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(Error);
      const appErr = err as Error & { status?: number };
      expect(appErr.message).toContain('too large');
      expect(appErr.status).toBe(413);
    }
  });
});
