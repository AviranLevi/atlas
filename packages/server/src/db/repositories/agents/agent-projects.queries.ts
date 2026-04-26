// External
import { and, eq } from 'drizzle-orm';

// Shared
import type { Agent, Project } from '@atlas/shared';

// DB
import type { DB } from '../../index.js';
import { agentProjects, agents, projects } from '../../schema/index.js';

// Lib
import { AppError } from '../../../lib/errors.js';
import { logger } from '../../../lib/logger.js';

const FILE_PATH = 'db/repositories/agents/agent-projects.queries.ts';

export function findProjectsByAgentId(db: DB, agentId: string): (Project & { role: string | null })[] {
  const FUNCTION_NAME = 'findProjectsByAgentId';
  try {
    const projectRows = db.select().from(agentProjects).where(eq(agentProjects.agentId, agentId)).all();
    const result: (Project & { role: string | null })[] = [];
    for (const row of projectRows) {
      const project = db.select().from(projects).where(eq(projects.id, row.projectId)).get();
      if (project) {
        result.push({ ...(project as Project), role: row.role });
      }
    }
    return result;
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query agent projects', { cause: error });
  }
}

export function findAgentsByProjectIdWithRole(db: DB, projectId: string): (Agent & { role: string | null })[] {
  const FUNCTION_NAME = 'findAgentsByProjectIdWithRole';
  try {
    const rows = db.select().from(agentProjects).where(eq(agentProjects.projectId, projectId)).all();
    const result: (Agent & { role: string | null })[] = [];
    for (const row of rows) {
      const agent = db.select().from(agents).where(eq(agents.id, row.agentId)).get();
      if (agent) {
        result.push({ ...(agent as Agent), role: row.role });
      }
    }
    return result;
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query agents by project', { cause: error });
  }
}

export function findAgentProject(db: DB, agentId: string, projectId: string): { role: string | null } | null {
  const FUNCTION_NAME = 'findAgentProject';
  try {
    const row = db
      .select()
      .from(agentProjects)
      .where(and(eq(agentProjects.agentId, agentId), eq(agentProjects.projectId, projectId)))
      .get();
    return row ? { role: row.role } : null;
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to query agent project link', { cause: error });
  }
}

export function insertAgentProject(db: DB, agentId: string, projectId: string, role: string | null): void {
  const FUNCTION_NAME = 'insertAgentProject';
  try {
    db.insert(agentProjects).values({ agentId, projectId, role }).run();
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to insert agent project link', { cause: error });
  }
}

export function deleteAgentProject(db: DB, agentId: string, projectId: string): void {
  const FUNCTION_NAME = 'deleteAgentProject';
  try {
    db.delete(agentProjects)
      .where(and(eq(agentProjects.agentId, agentId), eq(agentProjects.projectId, projectId)))
      .run();
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to delete agent project link', { cause: error });
  }
}

export function updateAgentProjectRole(db: DB, agentId: string, projectId: string, role: string | null): void {
  const FUNCTION_NAME = 'updateAgentProjectRole';
  try {
    db.update(agentProjects)
      .set({ role })
      .where(and(eq(agentProjects.agentId, agentId), eq(agentProjects.projectId, projectId)))
      .run();
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
    throw new AppError('Failed to update agent project role', { cause: error });
  }
}
