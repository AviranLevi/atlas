// External
import { and, eq } from 'drizzle-orm';

// Shared
import type { Skill } from '@atlas/shared';

// DB
import type { DB } from '../../index.js';
import { agentSkills, skills } from '../../schema/index.js';

// Lib
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'db/repositories/agents/agent-skills.queries.ts';

export function findSkillsByAgentId(db: DB, agentId: string): Skill[] {
  const FUNCTION_NAME = 'findSkillsByAgentId';
  try {
    const agentSkillRows = db
      .select({ skillId: agentSkills.skillId })
      .from(agentSkills)
      .where(eq(agentSkills.agentId, agentId))
      .all();
    const resolved: Skill[] = [];
    for (const r of agentSkillRows) {
      const row = db.select().from(skills).where(eq(skills.id, r.skillId)).get();
      if (row) resolved.push(row as Skill);
    }
    return resolved;
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query agent skills', { cause: error });
  }
}

export function findSkillsByProjectId(db: DB, projectId: string): Skill[] {
  const FUNCTION_NAME = 'findSkillsByProjectId';
  try {
    return db.select().from(skills).where(eq(skills.projectId, projectId)).all() as Skill[];
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query project skills', { cause: error });
  }
}

export function findAgentSkill(db: DB, agentId: string, skillId: string): boolean {
  const FUNCTION_NAME = 'findAgentSkill';
  try {
    const row = db
      .select()
      .from(agentSkills)
      .where(and(eq(agentSkills.agentId, agentId), eq(agentSkills.skillId, skillId)))
      .get();
    return row != null;
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query agent skill link', { cause: error });
  }
}

export function insertAgentSkill(db: DB, agentId: string, skillId: string): void {
  const FUNCTION_NAME = 'insertAgentSkill';
  try {
    db.insert(agentSkills).values({ agentId, skillId }).run();
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to insert agent skill link', { cause: error });
  }
}

export function deleteAgentSkill(db: DB, agentId: string, skillId: string): void {
  const FUNCTION_NAME = 'deleteAgentSkill';
  try {
    db.delete(agentSkills)
      .where(and(eq(agentSkills.agentId, agentId), eq(agentSkills.skillId, skillId)))
      .run();
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to delete agent skill link', { cause: error });
  }
}
