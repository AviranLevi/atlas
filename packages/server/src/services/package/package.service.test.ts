// External
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Shared
import type { Agent, AgentProvider, Rule, Skill } from '@atlas/shared';
import { AtlasPackageSchema } from '@atlas/shared';

vi.mock('../index.js', () => ({
  agentsService: {
    list: vi.fn(),
    getById: vi.fn(),
    getDetail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    attachSkill: vi.fn(),
    attachRule: vi.fn(),
  },
  skillsService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  rulesService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  agentProvidersService: {
    list: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock('../../lib/logger.js', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock('../../lib/errors.js', () => ({
  AppError: class AppError extends Error {
    constructor(message: string, opts?: { cause?: unknown }) {
      super(message);
      this.cause = opts?.cause;
    }
  },
}));

// Services
import { agentProvidersService, agentsService, rulesService, skillsService } from '../index.js';
import { PackageService } from './package.service.js';

const mAgents = vi.mocked(agentsService);
const mSkills = vi.mocked(skillsService);
const mRules = vi.mocked(rulesService);
const mProviders = vi.mocked(agentProvidersService);

const svc = new PackageService();

const TS = '2025-01-01T00:00:00.000Z';
const PKG_DEFAULTS = { description: '', author: '', tags: [] as string[] };

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'agent-1',
    name: 'Test Agent',
    description: 'desc',
    personality: 'friendly',
    unbreakableRules: 'be safe',
    providerId: 'prov-1',
    defaultModel: 'claude-sonnet',
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: 'skill-1',
    name: 'Test Skill',
    type: 'Coding',
    steps: 'step 1\nstep 2',
    inputFormat: 'markdown',
    outputFormat: 'code',
    projectId: null,
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule-1',
    name: 'Test Rule',
    type: 'General',
    tags: ['ts'],
    content: 'Always use TypeScript',
    projectId: null,
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

function makeProvider(overrides: Partial<AgentProvider> = {}): AgentProvider {
  return {
    id: 'prov-1',
    name: 'My Anthropic',
    type: 'anthropic',
    apiKey: 'sk-xxx',
    baseUrl: null,
    modelName: 'claude-sonnet-4-20250514',
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PackageService', () => {
  describe('exportAgent', () => {
    it('produces a valid AtlasPackage', async () => {
      const agent = makeAgent();
      const skill = makeSkill();
      const rule = makeRule();
      const provider = makeProvider();

      mAgents.getDetail.mockResolvedValue({
        agent,
        skills: [skill],
        rules: [rule],
        projects: [],
      });
      mProviders.getById.mockResolvedValue(provider);

      const pkg = await svc.exportAgent('agent-1');

      expect(AtlasPackageSchema.safeParse(pkg).success).toBe(true);
      expect(pkg.type).toBe('agent');
      expect(pkg.name).toBe('Test Agent');
    });

    it('strips IDs, timestamps, and projectId', async () => {
      const agent = makeAgent();
      const skill = makeSkill({ projectId: 'proj-1' });
      const rule = makeRule({ projectId: 'proj-1' });

      mAgents.getDetail.mockResolvedValue({
        agent,
        skills: [skill],
        rules: [rule],
        projects: [],
      });
      mProviders.getById.mockResolvedValue(makeProvider());

      const pkg = await svc.exportAgent('agent-1');

      const raw = JSON.stringify(pkg);
      expect(raw).not.toContain('"id"');
      expect(raw).not.toContain('"createdAt"');
      expect(raw).not.toContain('"updatedAt"');
      expect(raw).not.toContain('"projectId"');
      expect(raw).not.toContain('"providerId"');
    });

    it('resolves providerId to a provider hint', async () => {
      const agent = makeAgent({ providerId: 'prov-1', defaultModel: 'claude-haiku' });
      mAgents.getDetail.mockResolvedValue({
        agent,
        skills: [],
        rules: [],
        projects: [],
      });
      mProviders.getById.mockResolvedValue(makeProvider());

      const pkg = await svc.exportAgent('agent-1');

      expect(pkg.agent?.provider).toEqual({
        type: 'anthropic',
        model: 'claude-haiku',
      });
    });

    it('exports without provider hint when agent has no provider', async () => {
      const agent = makeAgent({ providerId: null, defaultModel: null });
      mAgents.getDetail.mockResolvedValue({
        agent,
        skills: [],
        rules: [],
        projects: [],
      });

      const pkg = await svc.exportAgent('agent-1');

      expect(pkg.agent?.provider).toBeUndefined();
      expect(mProviders.getById).not.toHaveBeenCalled();
    });
  });

  describe('exportSkill', () => {
    it('produces a valid skill package', async () => {
      mSkills.getById.mockResolvedValue(makeSkill());

      const pkg = await svc.exportSkill('skill-1');

      expect(pkg.type).toBe('skill');
      expect(pkg.skills).toHaveLength(1);
      expect(pkg.skills![0].name).toBe('Test Skill');
      expect(AtlasPackageSchema.safeParse(pkg).success).toBe(true);
    });
  });

  describe('exportRule', () => {
    it('produces a valid rule package', async () => {
      mRules.getById.mockResolvedValue(makeRule());

      const pkg = await svc.exportRule('rule-1');

      expect(pkg.type).toBe('rule');
      expect(pkg.rules).toHaveLength(1);
      expect(pkg.rules![0].name).toBe('Test Rule');
      expect(AtlasPackageSchema.safeParse(pkg).success).toBe(true);
    });
  });

  describe('previewImport', () => {
    const validPkg = {
      atlas: '1.0' as const,
      type: 'agent' as const,
      name: 'Test Agent',
      version: '1.0.0',
      agent: { name: 'Test Agent', description: null, personality: null, unbreakableRules: null },
      skills: [{ name: 'Skill A', type: 'Coding' as const, steps: null, inputFormat: null, outputFormat: null }],
      rules: [{ name: 'Rule A', type: 'General' as const, tags: [], content: null }],
    };

    it('detects name conflicts', async () => {
      mAgents.list.mockResolvedValue([makeAgent({ id: 'a1', name: 'Test Agent' })]);
      mSkills.list.mockResolvedValue([makeSkill({ id: 's1', name: 'Skill A' })]);
      mRules.list.mockResolvedValue([]);
      mProviders.list.mockResolvedValue([]);

      const preview = await svc.previewImport(validPkg);

      expect(preview.agent?.conflict).toEqual({ id: 'a1', name: 'Test Agent' });
      expect(preview.skills[0].conflict).toEqual({ id: 's1', name: 'Skill A' });
      expect(preview.rules[0].conflict).toBeNull();
    });

    it('matches provider by type', async () => {
      const pkgWithProvider = {
        ...validPkg,
        agent: { ...validPkg.agent, provider: { type: 'anthropic' as const, model: 'claude-sonnet' } },
      };

      mAgents.list.mockResolvedValue([]);
      mSkills.list.mockResolvedValue([]);
      mRules.list.mockResolvedValue([]);
      mProviders.list.mockResolvedValue([makeProvider({ id: 'p1', name: 'My Anthropic' })]);

      const preview = await svc.previewImport(pkgWithProvider);

      expect(preview.providerHint?.matchedProvider).toEqual({ id: 'p1', name: 'My Anthropic' });
    });

    it('rejects malformed packages', async () => {
      await expect(svc.previewImport({ garbage: true })).rejects.toThrow();
    });
  });

  describe('executeImport', () => {
    it('creates all entities when no conflicts', async () => {
      mSkills.list.mockResolvedValue([]);
      mRules.list.mockResolvedValue([]);
      mAgents.list.mockResolvedValue([]);
      mSkills.create.mockResolvedValue(makeSkill({ id: 'new-s1' }));
      mRules.create.mockResolvedValue(makeRule({ id: 'new-r1' }));
      mAgents.create.mockResolvedValue(makeAgent({ id: 'new-a1' }));
      mAgents.attachSkill.mockResolvedValue(undefined);
      mAgents.attachRule.mockResolvedValue(undefined);

      const result = await svc.executeImport({
        package: {
          atlas: '1.0',
          type: 'agent',
          name: 'New Agent',
          version: '1.0.0',
          ...PKG_DEFAULTS,
          agent: { name: 'New Agent', description: null, personality: null, unbreakableRules: null },
          skills: [{ name: 'New Skill', type: 'Coding', steps: null, inputFormat: null, outputFormat: null }],
          rules: [{ name: 'New Rule', type: 'General', tags: [], content: null }],
        },
        resolutions: {
          skills: {},
          rules: {},
        },
      });

      expect(result.agentId).toBe('new-a1');
      expect(result.skillIds).toEqual(['new-s1']);
      expect(result.ruleIds).toEqual(['new-r1']);
      expect(mAgents.attachSkill).toHaveBeenCalledWith('new-a1', 'new-s1');
      expect(mAgents.attachRule).toHaveBeenCalledWith('new-a1', 'new-r1');
    });

    it('overwrites existing entities when resolution is overwrite', async () => {
      mSkills.list.mockResolvedValue([makeSkill({ id: 'existing-s1', name: 'Existing Skill' })]);
      mRules.list.mockResolvedValue([]);
      mAgents.list.mockResolvedValue([]);
      mSkills.update.mockResolvedValue(makeSkill({ id: 'existing-s1' }));
      mAgents.create.mockResolvedValue(makeAgent({ id: 'new-a1' }));
      mAgents.attachSkill.mockResolvedValue(undefined);

      const result = await svc.executeImport({
        package: {
          atlas: '1.0',
          type: 'agent',
          name: 'New Agent',
          version: '1.0.0',
          ...PKG_DEFAULTS,
          agent: { name: 'New Agent', description: null, personality: null, unbreakableRules: null },
          skills: [{ name: 'Existing Skill', type: 'Coding', steps: 'updated', inputFormat: null, outputFormat: null }],
          rules: [],
        },
        resolutions: {
          skills: { 'Existing Skill': { action: 'overwrite' } },
          rules: {},
        },
      });

      expect(mSkills.update).toHaveBeenCalledWith('existing-s1', expect.objectContaining({ steps: 'updated' }));
      expect(result.skillIds).toEqual(['existing-s1']);
    });

    it('creates renamed entity when resolution is rename', async () => {
      mSkills.list.mockResolvedValue([makeSkill({ id: 'existing-s1', name: 'My Skill' })]);
      mRules.list.mockResolvedValue([]);
      mAgents.list.mockResolvedValue([]);
      mSkills.create.mockResolvedValue(makeSkill({ id: 'new-s2', name: 'My Skill (imported)' }));
      mAgents.create.mockResolvedValue(makeAgent({ id: 'new-a1' }));
      mAgents.attachSkill.mockResolvedValue(undefined);

      const result = await svc.executeImport({
        package: {
          atlas: '1.0',
          type: 'agent',
          name: 'New Agent',
          version: '1.0.0',
          ...PKG_DEFAULTS,
          agent: { name: 'New Agent', description: null, personality: null, unbreakableRules: null },
          skills: [{ name: 'My Skill', type: 'Coding', steps: null, inputFormat: null, outputFormat: null }],
          rules: [],
        },
        resolutions: {
          skills: { 'My Skill': { action: 'rename', rename: 'My Skill (imported)' } },
          rules: {},
        },
      });

      expect(mSkills.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'My Skill (imported)' }));
      expect(result.skillIds).toEqual(['new-s2']);
    });
  });
});
