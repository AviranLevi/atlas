// Shared
import type { AtlasPackage, ImportPreview, ImportResolution, ImportSummary } from '@atlas/shared';

// Repositories
import { agentsRepository, rulesRepository, skillsRepository } from '../../db/repositories/index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/package-io/package-importer.service.ts';

export class PackageImporterService {
  /** Previews importing an Atlas Package — returns conflict information. */
  async previewImport(pkg: AtlasPackage): Promise<ImportPreview> {
    const FUNCTION_NAME = 'previewImport';
    try {
      const items: ImportPreview['items'] = [];
      const allSkills = skillsRepository.findAll();
      const allRules = rulesRepository.findAll();
      const allAgents = agentsRepository.findAll();

      const skillNames = new Set(allSkills.map((s) => s.name));
      const ruleNames = new Set(allRules.map((r) => r.name));
      const agentNames = new Set(allAgents.map((a) => a.name));

      if (pkg.type === 'skill') {
        const name = (pkg.content as { name: string }).name;
        items.push({
          type: 'skill',
          name,
          action: skillNames.has(name) ? 'rename' : 'create',
          renamedTo: skillNames.has(name) ? `${name}-imported` : undefined,
        });
      } else if (pkg.type === 'rule') {
        const name = (pkg.content as { name: string }).name;
        items.push({
          type: 'rule',
          name,
          action: ruleNames.has(name) ? 'rename' : 'create',
          renamedTo: ruleNames.has(name) ? `${name}-imported` : undefined,
        });
      } else if (pkg.type === 'agent') {
        const content = pkg.content as { name: string; skills?: { name: string }[]; rules?: { name: string }[] };
        items.push({
          type: 'agent',
          name: content.name,
          action: agentNames.has(content.name) ? 'rename' : 'create',
          renamedTo: agentNames.has(content.name) ? `${content.name}-imported` : undefined,
        });
        for (const s of content.skills ?? []) {
          items.push({
            type: 'skill',
            name: s.name,
            action: skillNames.has(s.name) ? 'rename' : 'create',
            renamedTo: skillNames.has(s.name) ? `${s.name}-imported` : undefined,
          });
        }
        for (const r of content.rules ?? []) {
          items.push({
            type: 'rule',
            name: r.name,
            action: ruleNames.has(r.name) ? 'rename' : 'create',
            renamedTo: ruleNames.has(r.name) ? `${r.name}-imported` : undefined,
          });
        }
      } else if (pkg.type === 'collection') {
        const content = pkg.content as {
          skills?: { name: string }[];
          rules?: { name: string }[];
          agents?: { name: string; skills?: { name: string }[]; rules?: { name: string }[] }[];
        };
        for (const s of content.skills ?? []) {
          items.push({
            type: 'skill',
            name: s.name,
            action: skillNames.has(s.name) ? 'rename' : 'create',
            renamedTo: skillNames.has(s.name) ? `${s.name}-imported` : undefined,
          });
        }
        for (const r of content.rules ?? []) {
          items.push({
            type: 'rule',
            name: r.name,
            action: ruleNames.has(r.name) ? 'rename' : 'create',
            renamedTo: ruleNames.has(r.name) ? `${r.name}-imported` : undefined,
          });
        }
        for (const a of content.agents ?? []) {
          items.push({
            type: 'agent',
            name: a.name,
            action: agentNames.has(a.name) ? 'rename' : 'create',
            renamedTo: agentNames.has(a.name) ? `${a.name}-imported` : undefined,
          });
        }
      }

      return { items, hasConflicts: items.some((i) => i.action !== 'create') };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to preview import', { cause: error });
    }
  }

  /** Applies an import with resolved conflicts. */
  async applyImport(pkg: AtlasPackage, resolutions: ImportResolution[], projectId?: string): Promise<ImportSummary> {
    const FUNCTION_NAME = 'applyImport';
    try {
      const resolutionMap = new Map(resolutions.map((r) => [r.name, r]));
      let created = 0;
      let skipped = 0;
      let renamed = 0;

      const insertSkill = (data: Record<string, unknown>) => {
        const name = data.name as string;
        const res = resolutionMap.get(name);
        if (res?.action === 'skip') {
          skipped++;
          return;
        }
        const finalName = res?.action === 'rename' ? (res.renamedTo ?? `${name}-imported`) : name;
        if (res?.action === 'rename') renamed++;
        else created++;
        skillsRepository.insert({ ...data, name: finalName, projectId: projectId ?? null } as never);
      };

      const insertRule = (data: Record<string, unknown>) => {
        const name = data.name as string;
        const res = resolutionMap.get(name);
        if (res?.action === 'skip') {
          skipped++;
          return;
        }
        const finalName = res?.action === 'rename' ? (res.renamedTo ?? `${name}-imported`) : name;
        if (res?.action === 'rename') renamed++;
        else created++;
        rulesRepository.insert({ ...data, name: finalName, projectId: projectId ?? null } as never);
      };

      const insertAgent = (data: Record<string, unknown>) => {
        const name = data.name as string;
        const res = resolutionMap.get(name);
        if (res?.action === 'skip') {
          skipped++;
          return;
        }
        const finalName = res?.action === 'rename' ? (res.renamedTo ?? `${name}-imported`) : name;
        if (res?.action === 'rename') renamed++;
        else created++;
        const { skills: _s, rules: _r, ...agentData } = data;
        agentsRepository.insert({ ...agentData, name: finalName } as never);
      };

      if (pkg.type === 'skill') {
        insertSkill(pkg.content as Record<string, unknown>);
      } else if (pkg.type === 'rule') {
        insertRule(pkg.content as Record<string, unknown>);
      } else if (pkg.type === 'agent') {
        const content = pkg.content as Record<string, unknown> & {
          skills?: Record<string, unknown>[];
          rules?: Record<string, unknown>[];
        };
        insertAgent(content);
        for (const s of content.skills ?? []) insertSkill(s);
        for (const r of content.rules ?? []) insertRule(r);
      } else if (pkg.type === 'collection') {
        const content = pkg.content as {
          skills?: Record<string, unknown>[];
          rules?: Record<string, unknown>[];
          agents?: (Record<string, unknown> & {
            skills?: Record<string, unknown>[];
            rules?: Record<string, unknown>[];
          })[];
        };
        for (const s of content.skills ?? []) insertSkill(s);
        for (const r of content.rules ?? []) insertRule(r);
        for (const a of content.agents ?? []) insertAgent(a);
      }

      return { created, skipped, renamed };
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to apply import', { cause: error });
    }
  }
}
