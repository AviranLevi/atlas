import type {
  AtlasPackage,
  ImportRequest,
  Agent,
  Skill,
  Rule,
  AgentProvider,
} from '@atlas/shared';
import { AtlasPackageSchema } from '@atlas/shared';

import {
  agentsService,
  skillsService,
  rulesService,
  agentProvidersService,
} from '../index.js';
import { logger } from '../../lib/logger.js';
import { AppError } from '../../lib/errors.js';

import type { ImportPreview, ImportSummary } from './package.types.js';

const FILE_PATH = 'services/package/package.service.ts';

function stripEntity<T extends { id: string; createdAt: string; updatedAt: string }>(
  entity: T,
): Omit<T, 'id' | 'createdAt' | 'updatedAt'> {
  const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = entity;
  return rest;
}

export class PackageService {
  async exportAgent(agentId: string): Promise<AtlasPackage> {
    const FUNCTION_NAME = 'exportAgent';
    try {
      const detail = await agentsService.getDetail(agentId);
      const { agent, skills, rules } = detail;

      let providerHint: { type: string; model: string } | undefined;
      if (agent.providerId) {
        try {
          const provider = await agentProvidersService.getById(agent.providerId);
          providerHint = { type: provider.type, model: agent.defaultModel ?? provider.modelName };
        } catch {
          // Provider not found -- export without hint
        }
      }

      const packageAgent = {
        name: agent.name,
        description: agent.description,
        personality: agent.personality,
        unbreakableRules: agent.unbreakableRules,
        ...(providerHint ? { provider: providerHint } : {}),
      };

      const packageSkills = (skills as Skill[]).map((s) => {
        const { projectId: _pid, ...stripped } = stripEntity(s);
        return stripped;
      });

      const packageRules = (rules as Rule[]).map((r) => {
        const { projectId: _pid, ...stripped } = stripEntity(r);
        return stripped;
      });

      return {
        atlas: '1.0',
        type: 'agent',
        name: agent.name,
        version: '1.0.0',
        description: agent.description ?? '',
        author: '',
        tags: [],
        agent: packageAgent,
        skills: packageSkills,
        rules: packageRules,
      } as AtlasPackage;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to export agent package', { cause: error });
    }
  }

  async exportSkill(skillId: string): Promise<AtlasPackage> {
    const FUNCTION_NAME = 'exportSkill';
    try {
      const skill = await skillsService.getById(skillId);
      const { projectId: _pid, ...stripped } = stripEntity(skill);

      return {
        atlas: '1.0',
        type: 'skill',
        name: skill.name,
        version: '1.0.0',
        description: '',
        author: '',
        tags: [],
        skills: [stripped],
        rules: [],
      } as AtlasPackage;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to export skill package', { cause: error });
    }
  }

  async exportRule(ruleId: string): Promise<AtlasPackage> {
    const FUNCTION_NAME = 'exportRule';
    try {
      const rule = await rulesService.getById(ruleId);
      const { projectId: _pid, ...stripped } = stripEntity(rule);

      return {
        atlas: '1.0',
        type: 'rule',
        name: rule.name,
        version: '1.0.0',
        description: '',
        author: '',
        tags: [],
        skills: [],
        rules: [stripped],
      } as AtlasPackage;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to export rule package', { cause: error });
    }
  }

  async previewImport(raw: unknown): Promise<ImportPreview> {
    const FUNCTION_NAME = 'previewImport';
    try {
      const pkg = AtlasPackageSchema.parse(raw);

      const [allAgents, allSkills, allRules, allProviders] = await Promise.all([
        agentsService.list(),
        skillsService.list(),
        rulesService.list(),
        agentProvidersService.list(),
      ]);

      const agentPreview = pkg.agent
        ? {
            data: pkg.agent,
            conflict: findByName(allAgents, pkg.agent.name),
          }
        : null;

      const skillPreviews = (pkg.skills ?? []).map((s) => ({
        data: s,
        conflict: findByName(allSkills, s.name),
      }));

      const rulePreviews = (pkg.rules ?? []).map((r) => ({
        data: r,
        conflict: findByName(allRules, r.name),
      }));

      let providerHint: ImportPreview['providerHint'] = null;
      if (pkg.agent?.provider) {
        const hint = pkg.agent.provider;
        const matched = allProviders.find((p) => p.type === hint.type);
        providerHint = {
          hint,
          matchedProvider: matched ? { id: matched.id, name: matched.name } : null,
        };
      }

      return {
        agent: agentPreview,
        skills: skillPreviews,
        rules: rulePreviews,
        providerHint,
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to preview import', { cause: error });
    }
  }

  async executeImport(request: ImportRequest): Promise<ImportSummary> {
    const FUNCTION_NAME = 'executeImport';
    try {
      const pkg = request.package;
      const res = request.resolutions;
      const skillIds: string[] = [];
      const ruleIds: string[] = [];
      const nameToSkillId = new Map<string, string>();
      const nameToRuleId = new Map<string, string>();

      const [allSkills, allRules] = await Promise.all([
        skillsService.list(),
        rulesService.list(),
      ]);

      for (const skillData of pkg.skills ?? []) {
        const resolution = res.skills[skillData.name];
        const existing = findByName(allSkills, skillData.name);

        if (existing && (!resolution || resolution.action === 'create')) {
          skillIds.push(existing.id);
          nameToSkillId.set(skillData.name, existing.id);
          continue;
        }

        if (existing && resolution?.action === 'overwrite') {
          const updated = await skillsService.update(existing.id, skillData);
          skillIds.push(updated.id);
          nameToSkillId.set(skillData.name, updated.id);
          continue;
        }

        const createName = resolution?.action === 'rename' && resolution.rename
          ? resolution.rename
          : skillData.name;
        const created = await skillsService.create({ ...skillData, name: createName });
        skillIds.push(created.id);
        nameToSkillId.set(skillData.name, created.id);
      }

      for (const ruleData of pkg.rules ?? []) {
        const resolution = res.rules[ruleData.name];
        const existing = findByName(allRules, ruleData.name);

        if (existing && (!resolution || resolution.action === 'create')) {
          ruleIds.push(existing.id);
          nameToRuleId.set(ruleData.name, existing.id);
          continue;
        }

        if (existing && resolution?.action === 'overwrite') {
          const updated = await rulesService.update(existing.id, ruleData);
          ruleIds.push(updated.id);
          nameToRuleId.set(ruleData.name, updated.id);
          continue;
        }

        const createName = resolution?.action === 'rename' && resolution.rename
          ? resolution.rename
          : ruleData.name;
        const created = await rulesService.create({ ...ruleData, name: createName });
        ruleIds.push(created.id);
        nameToRuleId.set(ruleData.name, created.id);
      }

      let agentId: string | null = null;
      if (pkg.agent) {
        const agentRes = res.agent;
        const allAgents = await agentsService.list();
        const existing = findByName(allAgents, pkg.agent.name);

        const agentCreateData = {
          name: pkg.agent.name,
          description: pkg.agent.description ?? null,
          personality: pkg.agent.personality ?? null,
          unbreakableRules: pkg.agent.unbreakableRules ?? null,
          providerId: res.providerId ?? null,
          defaultModel: pkg.agent.provider?.model ?? null,
        };

        if (existing && agentRes?.action === 'overwrite') {
          const updated = await agentsService.update(existing.id, agentCreateData);
          agentId = updated.id;
        } else if (agentRes?.action === 'rename' && agentRes.rename) {
          const created = await agentsService.create({ ...agentCreateData, name: agentRes.rename });
          agentId = created.id;
        } else if (!existing) {
          const created = await agentsService.create(agentCreateData);
          agentId = created.id;
        } else {
          agentId = existing.id;
        }

        for (const sid of skillIds) {
          await agentsService.attachSkill(agentId, sid);
        }
        for (const rid of ruleIds) {
          await agentsService.attachRule(agentId, rid);
        }
      }

      return { agentId, skillIds, ruleIds };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to execute import', { cause: error });
    }
  }
}

function findByName<T extends { id: string; name: string }>(
  entities: T[],
  name: string,
): { id: string; name: string } | null {
  const match = entities.find((e) => e.name === name);
  return match ? { id: match.id, name: match.name } : null;
}
