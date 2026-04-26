// External
import { and, eq } from 'drizzle-orm';

// Shared
import type { Rule } from '@atlas/shared';

// DB
import type { DB } from '../../index.js';
import { agentRules, rules } from '../../schema/index.js';

// Lib
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';
import { parseTags } from '../../../lib/utils/index.js';

const FILE_PATH = 'db/repositories/agents/agent-rules.queries.ts';

export function findRulesByAgentId(db: DB, agentId: string): Rule[] {
  const FUNCTION_NAME = 'findRulesByAgentId';
  try {
    const agentRuleRows = db
      .select({ ruleId: agentRules.ruleId })
      .from(agentRules)
      .where(eq(agentRules.agentId, agentId))
      .all();
    const resolved: Rule[] = [];
    for (const r of agentRuleRows) {
      const row = db.select().from(rules).where(eq(rules.id, r.ruleId)).get();
      if (row) {
        resolved.push({ ...row, tags: parseTags(row.tags) } as Rule);
      }
    }
    return resolved;
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query agent rules', { cause: error });
  }
}

export function findRulesByProjectId(db: DB, projectId: string): Rule[] {
  const FUNCTION_NAME = 'findRulesByProjectId';
  try {
    const projectRuleRows = db.select().from(rules).where(eq(rules.projectId, projectId)).all();
    return projectRuleRows.map((row) => ({
      ...row,
      tags: parseTags(row.tags),
    })) as Rule[];
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query project rules', { cause: error });
  }
}

export function findAgentRule(db: DB, agentId: string, ruleId: string): boolean {
  const FUNCTION_NAME = 'findAgentRule';
  try {
    const row = db
      .select()
      .from(agentRules)
      .where(and(eq(agentRules.agentId, agentId), eq(agentRules.ruleId, ruleId)))
      .get();
    return row != null;
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query agent rule link', { cause: error });
  }
}

export function insertAgentRule(db: DB, agentId: string, ruleId: string): void {
  const FUNCTION_NAME = 'insertAgentRule';
  try {
    db.insert(agentRules).values({ agentId, ruleId }).run();
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to insert agent rule link', { cause: error });
  }
}

export function deleteAgentRule(db: DB, agentId: string, ruleId: string): void {
  const FUNCTION_NAME = 'deleteAgentRule';
  try {
    db.delete(agentRules)
      .where(and(eq(agentRules.agentId, agentId), eq(agentRules.ruleId, ruleId)))
      .run();
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to delete agent rule link', { cause: error });
  }
}
