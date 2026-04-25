import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Stub out the repositories barrel before any service imports — its top-level evaluation
// instantiates a better-sqlite3 binding which can clash across Node versions in CI/local.
vi.mock('../src/db/repositories/index.js', () => ({
  projectsRepository: {},
}));

const { ProjectScaffoldService } = await import('../src/services/projects/project-scaffold.service.js');

const TEST_ROOT = fs.realpathSync(os.tmpdir());

function makeStubProjectsService() {
  return {
    create: vi.fn(async (data: { name: string; localPath: string | null; defaultBranch: string | null; color: string | null; status: string }) => ({
      id: 'fake-id',
      name: data.name,
      description: null,
      techStack: null,
      status: data.status,
      repositoryUrl: null,
      localPath: data.localPath,
      defaultBranch: data.defaultBranch,
      scanData: null,
      projectBrief: null,
      designContext: null,
      agentBehavior: null,
      color: data.color,
      mission: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  };
}

describe('ProjectScaffoldService.scaffold', () => {
  let tmp: string;
  let prevAllowed: string | undefined;

  beforeEach(() => {
    tmp = fs.realpathSync(fs.mkdtempSync(path.join(TEST_ROOT, 'atlas-scaffold-')));
    prevAllowed = process.env.ATLAS_ALLOWED_PARENT_ROOTS;
    process.env.ATLAS_ALLOWED_PARENT_ROOTS = tmp;
  });

  afterEach(() => {
    if (prevAllowed === undefined) delete process.env.ATLAS_ALLOWED_PARENT_ROOTS;
    else process.env.ATLAS_ALLOWED_PARENT_ROOTS = prevAllowed;
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('creates folder, initializes git, and registers the project', async () => {
    const stub = makeStubProjectsService();
    const service = new ProjectScaffoldService(stub as never);

    const project = await service.scaffold({
      parentPath: tmp,
      folderName: 'new-project',
      initGit: true,
      initialBranch: 'main',
      projectName: 'New Project',
      color: '#6366f1',
    });

    const target = path.join(tmp, 'new-project');
    expect(fs.statSync(target).isDirectory()).toBe(true);
    expect(fs.existsSync(path.join(target, '.git'))).toBe(true);
    const head = execSync('git symbolic-ref HEAD', { cwd: target, encoding: 'utf-8' }).trim();
    expect(head).toBe('refs/heads/main');

    expect(stub.create).toHaveBeenCalledWith({
      name: 'New Project',
      localPath: target,
      defaultBranch: 'main',
      color: '#6366f1',
      status: 'active',
    });
    expect(project.id).toBe('fake-id');
  });

  it('skips git init when initGit=false and stores defaultBranch=null', async () => {
    const stub = makeStubProjectsService();
    const service = new ProjectScaffoldService(stub as never);

    await service.scaffold({
      parentPath: tmp,
      folderName: 'no-git',
      initGit: false,
      initialBranch: 'main',
      projectName: 'No Git',
    });

    expect(fs.existsSync(path.join(tmp, 'no-git', '.git'))).toBe(false);
    expect(stub.create).toHaveBeenCalledWith(
      expect.objectContaining({ defaultBranch: null, localPath: path.join(tmp, 'no-git') }),
    );
  });

  it('rejects parents outside allowed roots without creating anything', async () => {
    const stub = makeStubProjectsService();
    const service = new ProjectScaffoldService(stub as never);

    process.env.ATLAS_ALLOWED_PARENT_ROOTS = path.join(tmp, 'nope');
    fs.mkdirSync(path.join(tmp, 'nope'));

    await expect(
      service.scaffold({
        parentPath: tmp,
        folderName: 'should-fail',
        initGit: false,
        initialBranch: 'main',
        projectName: 'Fail',
      }),
    ).rejects.toThrow(/not inside an allowed root/);

    expect(stub.create).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(tmp, 'should-fail'))).toBe(false);
  });

  it('rejects names with path separators', async () => {
    const stub = makeStubProjectsService();
    const service = new ProjectScaffoldService(stub as never);

    await expect(
      service.scaffold({
        parentPath: tmp,
        folderName: '../escape',
        initGit: false,
        initialBranch: 'main',
        projectName: 'Escape',
      }),
    ).rejects.toThrow(/separators/);
    expect(stub.create).not.toHaveBeenCalled();
  });
});
