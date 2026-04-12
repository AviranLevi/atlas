// Shared
import type { AtlasPackage } from '@atlas/shared';

// Repositories
import { agentsRepository, rulesRepository, skillsRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/package-io/package-exporter.service.ts';

export class PackageExporterService {
  /** Exports a skill as an Atlas Package. */
  async exportSkill(id: string): Promise<AtlasPackage> {
    const FUNCTION_NAME = 'exportSkill';
    try {
      const skill = skillsRepository.findByIdOrThrow(id);
      const { id: _id, projectId: _pid, createdAt: _ca, updatedAt: _ua, ...stripped } = skill;
      return {
        schemaVersion: '1.0',
        type: 'skill',
        metadata: {
          name: skill.name,
          description: stripped.steps ?? '',
          version: '1.0.0',
          atlasVersion: '1.0',
          tags: [],
          author: '',
        },
        content: stripped,
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to export skill', { cause: error });
    }
  }

  /** Exports a rule as an Atlas Package. */
  async exportRule(id: string): Promise<AtlasPackage> {
    const FUNCTION_NAME = 'exportRule';
    try {
      const rule = rulesRepository.findByIdOrThrow(id);
      const { id: _id, projectId: _pid, createdAt: _ca, updatedAt: _ua, ...stripped } = rule;
      return {
        schemaVersion: '1.0',
        type: 'rule',
        metadata: {
          name: rule.name,
          description: stripped.content ?? '',
          version: '1.0.0',
          atlasVersion: '1.0',
          tags: stripped.tags ?? [],
          author: '',
        },
        content: stripped,
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to export rule', { cause: error });
    }
  }

  /** Exports an agent with its attached skills and rules as an Atlas Package. */
  async exportAgent(id: string): Promise<AtlasPackage> {
    const FUNCTION_NAME = 'exportAgent';
    try {
      const agent = agentsRepository.findByIdOrThrow(id);
      const skills = agentsRepository.findSkillsByAgentId(id);
      const rules = agentsRepository.findRulesByAgentId(id);

      const { id: _id, providerId: _pid, createdAt: _ca, updatedAt: _ua, ...strippedAgent } = agent;
      const strippedSkills = skills.map(({ id: _sid, projectId: _spid, createdAt: _sca, updatedAt: _sua, ...s }) => s);
      const strippedRules = rules.map(({ id: _rid, projectId: _rpid, createdAt: _rca, updatedAt: _rua, ...r }) => r);

      return {
        schemaVersion: '1.0',
        type: 'agent',
        metadata: {
          name: agent.name,
          description: agent.description ?? '',
          version: '1.0.0',
          atlasVersion: '1.0',
          tags: [],
          author: '',
        },
        content: { ...strippedAgent, skills: strippedSkills, rules: strippedRules },
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to export agent', { cause: error });
    }
  }

  /** Exports a collection of skills, rules, and agents as an Atlas Package. */
  async exportCollection(ids: { skillIds: string[]; ruleIds: string[]; agentIds: string[] }): Promise<AtlasPackage> {
    const FUNCTION_NAME = 'exportCollection';
    try {
      const skills = ids.skillIds.map((sid) => {
        const s = skillsRepository.findByIdOrThrow(sid);
        const { id: _id, projectId: _pid, createdAt: _ca, updatedAt: _ua, ...stripped } = s;
        return stripped;
      });
      const rules = ids.ruleIds.map((rid) => {
        const r = rulesRepository.findByIdOrThrow(rid);
        const { id: _id, projectId: _pid, createdAt: _ca, updatedAt: _ua, ...stripped } = r;
        return stripped;
      });
      const agents = ids.agentIds.map((aid) => {
        const a = agentsRepository.findByIdOrThrow(aid);
        const aSkills = agentsRepository.findSkillsByAgentId(aid);
        const aRules = agentsRepository.findRulesByAgentId(aid);
        const { id: _id, providerId: _pid, createdAt: _ca, updatedAt: _ua, ...strippedAgent } = a;
        return {
          ...strippedAgent,
          skills: aSkills.map(({ id: _sid, projectId: _spid, createdAt: _sca, updatedAt: _sua, ...s }) => s),
          rules: aRules.map(({ id: _rid, projectId: _rpid, createdAt: _rca, updatedAt: _rua, ...r }) => r),
        };
      });

      return {
        schemaVersion: '1.0',
        type: 'collection',
        metadata: {
          name: 'Collection',
          description: `${skills.length} skills, ${rules.length} rules, ${agents.length} agents`,
          version: '1.0.0',
          atlasVersion: '1.0',
          tags: [],
          author: '',
        },
        content: { skills, rules, agents },
      };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to export collection', { cause: error });
    }
  }
}
