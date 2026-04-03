// External
import { describe, expect, it, vi } from 'vitest';

// Shared
import { AtlasPackageSchema } from '@atlas/shared';

// SUT
import { agentProvidersService, agentsService, rulesService, skillsService } from '../../../src/services/index.js';
import { PackageService } from '../../../src/services/package/package.service.js';

// Factories & Constants
import { makeAgent, makeProvider, makeRule, makeSkill } from '../../factories/index.js';
import { PKG_DEFAULTS } from '../../constants/index.js';

// Module mocks (test-specific)
vi.mock('../../../src/services/index.js', async () => {
  const { mockAgentsService } = await import('../../mocks/agents.service.mock.js');
  const { mockSkillsService } = await import('../../mocks/skills.service.mock.js');
  const { mockRulesService } = await import('../../mocks/rules.service.mock.js');
  const { mockProvidersService } = await import('../../mocks/agent-providers.service.mock.js');
  return {
    agentsService: mockAgentsService,
    skillsService: mockSkillsService,
    rulesService: mockRulesService,
    agentProvidersService: mockProvidersService,
  };
});

// Typed wrappers
const mAgents = vi.mocked(agentsService);
const mSkills = vi.mocked(skillsService);
const mRules = vi.mocked(rulesService);
const mProviders = vi.mocked(agentProvidersService);

const svc = new PackageService();

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
