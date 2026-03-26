// External
import { eq, sql } from 'drizzle-orm';

// Shared
import type { CreateProject, UpdateProject, Project } from '@my-agents/shared';

// DB
import type { DB } from '../index.js';
import { projects, tasks, agentProjects, agents, memory, workspaces, phases } from '../schema/index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';
import { parseTags } from '../../lib/utils/index.js';

const FILE_PATH = 'db/repositories/projects.repository.ts';

/** Parse scanData JSON from DB row */
function hydrateProject(row: Record<string, unknown>): Project {
  if (row.scanData && typeof row.scanData === 'string') {
    try {
      row.scanData = JSON.parse(row.scanData);
    } catch {
      row.scanData = null;
    }
  }
  return row as Project;
}

/** Serialize scanData to JSON string for DB */
function serializeScanData(data: Record<string, unknown>): Record<string, unknown> {
  if (data.scanData && typeof data.scanData === 'object') {
    return { ...data, scanData: JSON.stringify(data.scanData) };
  }
  return data;
}

export class ProjectsRepository {
  constructor(private readonly db: DB) {}

  /** Returns all projects with scanData JSON parsed. */
  findAll(): Project[] {
    const FUNCTION_NAME = 'findAll';
    try {
      const rows = this.db.select().from(projects).all();
      return rows.map((r) => hydrateProject(r as Record<string, unknown>));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query projects', { cause: error });
    }
  }

  /** Returns a project by ID with scanData JSON parsed, or null if not found. */
  findById(id: string): Project | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(projects).where(eq(projects.id, id)).get();
      return row ? hydrateProject(row as Record<string, unknown>) : null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query project', { cause: error });
    }
  }

  /** Returns a project by ID with scanData JSON parsed, or throws NotFoundError. */
  findByIdOrThrow(id: string): Project {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Project', id);
    }
    return row;
  }

  /** Inserts a new project with scanData serialized to JSON. */
  insert(data: CreateProject): Project {
    const FUNCTION_NAME = 'insert';
    try {
      const serialized = serializeScanData(data as Record<string, unknown>);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = this.db.insert(projects).values(serialized as any).returning().get();
      return hydrateProject(result as Record<string, unknown>);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert project', { cause: error });
    }
  }

  /** Updates a project with scanData serialized to JSON and returns the updated record. */
  update(id: string, data: UpdateProject | Record<string, unknown>): Project {
    const FUNCTION_NAME = 'update';
    try {
      const serialized = serializeScanData({ ...data, updatedAt: new Date().toISOString() });
      const result = this.db
        .update(projects)
        .set(serialized)
        .where(eq(projects.id, id))
        .returning()
        .get();
      return hydrateProject(result as Record<string, unknown>);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update project', { cause: error });
    }
  }

  /** Deletes a project by ID. */
  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(projects).where(eq(projects.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete project', { cause: error });
    }
  }

  /** Returns task counts keyed by status for a project. */
  countTasksByProject(projectId: string): Record<string, number> {
    const FUNCTION_NAME = 'countTasksByProject';
    try {
      const rows = this.db
        .select({
          status: tasks.status,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(tasks)
        .where(eq(tasks.projectId, projectId))
        .groupBy(tasks.status)
        .all();
      const counts: Record<string, number> = {};
      for (const row of rows) {
        counts[row.status ?? ''] = Number(row.count);
      }
      return counts;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to count tasks by project', { cause: error });
    }
  }

  /** Returns the number of agents assigned to a project. */
  countAgentsByProject(projectId: string): number {
    const FUNCTION_NAME = 'countAgentsByProject';
    try {
      const row = this.db
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(agentProjects)
        .where(eq(agentProjects.projectId, projectId))
        .get();
      return Number(row?.count ?? 0);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to count agents by project', { cause: error });
    }
  }

  /** Returns agents assigned to a project. */
  findAgentsByProjectId(projectId: string): Record<string, unknown>[] {
    const FUNCTION_NAME = 'findAgentsByProjectId';
    try {
      const agentProjectRows = this.db
        .select({ agentId: agentProjects.agentId })
        .from(agentProjects)
        .where(eq(agentProjects.projectId, projectId))
        .all();
      const assigned: Record<string, unknown>[] = [];
      for (const r of agentProjectRows) {
        const row = this.db.select().from(agents).where(eq(agents.id, r.agentId)).get();
        if (row) assigned.push(row as Record<string, unknown>);
      }
      return assigned;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query project agents', { cause: error });
    }
  }

  /** Returns tasks for a project with tags parsed. */
  findTasksByProjectId(projectId: string): Record<string, unknown>[] {
    const FUNCTION_NAME = 'findTasksByProjectId';
    try {
      const rawTasks = this.db.select().from(tasks).where(eq(tasks.projectId, projectId)).all();
      return rawTasks.map((t) => ({
        ...t,
        tags: typeof t.tags === 'string' ? parseTags(t.tags) : (t.tags ?? null),
      })) as Record<string, unknown>[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query project tasks', { cause: error });
    }
  }

  /** Returns memories scoped to a project. */
  findMemoriesByProjectId(projectId: string): Record<string, unknown>[] {
    const FUNCTION_NAME = 'findMemoriesByProjectId';
    try {
      return this.db.select().from(memory).where(eq(memory.projectId, projectId)).all() as Record<
        string,
        unknown
      >[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query project memories', { cause: error });
    }
  }

  /**
   * Deletes related rows then the project (workspaces, tasks, phases, memory, agent links).
   */
  removeWithRelations(id: string): void {
    const FUNCTION_NAME = 'removeWithRelations';
    try {
      this.db.delete(workspaces).where(eq(workspaces.projectId, id)).run();
      this.db.delete(tasks).where(eq(tasks.projectId, id)).run();
      this.db.delete(phases).where(eq(phases.projectId, id)).run();
      this.db.delete(memory).where(eq(memory.projectId, id)).run();
      this.db.delete(agentProjects).where(eq(agentProjects.projectId, id)).run();
      this.remove(id);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete project and relations', { cause: error });
    }
  }
}
