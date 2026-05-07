// Shared
import type { AiConfig, CreateRule, Rule, UpdateRule } from '@atlas/shared';

// Repositories
import { rulesRepository } from '../../db/repositories/index.js';

// Services
import { createResourceCrud } from '../shared/resource-crud.js';

// Lib
import { withAppError } from '../../lib/with-app-error.js';
import type { RuleDetail } from './rules.types.js';

const FILE_PATH = 'services/rules/rules.service.ts';

export class RulesService {
  private readonly crud;

  constructor(private readonly repo = rulesRepository) {
    this.crud = createResourceCrud<Rule, CreateRule, UpdateRule>(this.repo, {
      resourceName: 'rule',
      filePath: FILE_PATH,
    });
  }

  /**
   * Retrieves all rules, optionally filtered by projectId.
   * When projectId is provided, returns rules where projectId matches OR projectId is null (global).
   */
  list(filters?: { projectId?: string; type?: string }): Promise<Rule[]> {
    return this.crud.list(filters);
  }

  /** Returns a rule by ID. */
  getById(id: string): Promise<Rule> {
    return this.crud.getById(id);
  }

  /** Creates a new rule. */
  create(data: CreateRule): Promise<Rule> {
    return this.crud.create(data);
  }

  /** Updates a rule by ID. */
  update(id: string, data: UpdateRule): Promise<Rule> {
    return this.crud.update(id, data);
  }

  /** Deletes a rule by ID. */
  delete(id: string): Promise<void> {
    return this.crud.remove(id);
  }

  /** Returns the set of filePaths that have already been imported as rules for a project. */
  getImportedFilePaths(projectId: string): Set<string> {
    return this.repo.findImportedFilePaths(projectId);
  }

  /** Bulk-imports detected AI config files as rules linked to a project, skipping already-imported paths. */
  bulkImportRules(projectId: string, items: AiConfig[]): Promise<{ imported: number; ids: string[] }> {
    return withAppError(
      () => {
        const alreadyImported = this.repo.findImportedFilePaths(projectId);
        const ids: string[] = [];
        for (const item of items) {
          if (alreadyImported.has(item.filePath)) continue;
          const rule = this.repo.insert({
            name: item.name,
            type: item.type ?? 'General',
            tags: [item.source, item.filePath],
            content: item.content,
            projectId,
          });
          ids.push(rule.id);
        }
        return { imported: ids.length, ids };
      },
      { filePath: FILE_PATH, functionName: 'bulkImportRules', message: 'Failed to bulk-import rules' },
    );
  }

  /** Returns a rule with its associated agents. */
  getDetail(ruleId: string): Promise<RuleDetail> {
    return withAppError(
      async () => {
        const rule = await this.getById(ruleId);
        const agentsList = this.repo.findAgentsByRuleId(ruleId);
        return { rule, agents: agentsList };
      },
      { filePath: FILE_PATH, functionName: 'getDetail', message: 'Failed to get rule detail' },
    );
  }
}
