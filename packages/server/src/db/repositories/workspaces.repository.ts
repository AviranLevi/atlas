// NPM
import { eq } from 'drizzle-orm';
// DB
import type { DB } from '../index.js';
import { workspaces, tasks, projects } from '../schema/index.js';
// Utils
import { logger } from '../../lib/logger.js';
import { AppError, NotFoundError } from '../../lib/errors.js';
// Types
import type { Workspace } from '@my-agents/shared';

const FILE_PATH = 'db/repositories/workspaces.repository.ts';

type InsertWorkspace = {
  taskId: string;
  projectId: string;
  agentId?: string | null;
  agentRuntime: string;
  branchName: string;
  worktreePath: string;
  pid?: number | null;
  status?: string;
  output?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type UpdateWorkspace = Partial<Omit<InsertWorkspace, 'taskId' | 'projectId'>>;

export class WorkspacesRepository {
  constructor(private readonly db: DB) {}

  private parseComments(raw: string | null | undefined): Workspace['diffComments'] {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  private enrichRow(row: { workspaces: Workspace; tasks: { name: string } | null; projects: { name: string } | null }): Workspace {
    return {
      ...row.workspaces,
      diffComments: this.parseComments(row.workspaces.diffComments as unknown as string),
      taskName: row.tasks?.name ?? undefined,
      projectName: row.projects?.name ?? undefined,
    };
  }

  findAll(): Workspace[] {
    const FUNCTION_NAME = 'findAll';
    try {
      const rows = this.db
        .select()
        .from(workspaces)
        .leftJoin(tasks, eq(workspaces.taskId, tasks.id))
        .leftJoin(projects, eq(workspaces.projectId, projects.id))
        .all();
      return rows.map((r) => this.enrichRow(r as any));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query workspaces', { cause: error });
    }
  }

  findByStatus(status: string): Workspace[] {
    const FUNCTION_NAME = 'findByStatus';
    try {
      const rows = this.db
        .select()
        .from(workspaces)
        .leftJoin(tasks, eq(workspaces.taskId, tasks.id))
        .leftJoin(projects, eq(workspaces.projectId, projects.id))
        .where(eq(workspaces.status, status))
        .all();
      return rows.map((r) => this.enrichRow(r as any));
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query workspaces by status', { cause: error });
    }
  }

  findByTaskId(taskId: string): Workspace | null {
    const FUNCTION_NAME = 'findByTaskId';
    try {
      const row = this.db
        .select()
        .from(workspaces)
        .where(eq(workspaces.taskId, taskId))
        .get();
      if (!row) return null;
      return { ...row, diffComments: this.parseComments(row.diffComments) } as Workspace;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query workspace by task', { cause: error });
    }
  }

  findById(id: string): Workspace | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db
        .select()
        .from(workspaces)
        .leftJoin(tasks, eq(workspaces.taskId, tasks.id))
        .leftJoin(projects, eq(workspaces.projectId, projects.id))
        .where(eq(workspaces.id, id))
        .get();
      if (!row) return null;
      return this.enrichRow(row as any);
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query workspace', { cause: error });
    }
  }

  findByIdOrThrow(id: string): Workspace {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Workspace', id);
    }
    return row;
  }

  insert(data: InsertWorkspace): Workspace {
    const FUNCTION_NAME = 'insert';
    try {
      return this.db.insert(workspaces).values(data).returning().get() as Workspace;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to insert workspace', { cause: error });
    }
  }

  update(id: string, data: UpdateWorkspace): Workspace {
    const FUNCTION_NAME = 'update';
    try {
      return this.db
        .update(workspaces)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(eq(workspaces.id, id))
        .returning()
        .get() as Workspace;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to update workspace', { cause: error });
    }
  }

  remove(id: string): void {
    const FUNCTION_NAME = 'remove';
    try {
      this.db.delete(workspaces).where(eq(workspaces.id, id)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to delete workspace', { cause: error });
    }
  }

  removeByTaskId(taskId: string): void {
    try {
      this.db.delete(workspaces).where(eq(workspaces.taskId, taskId)).run();
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: removeByTaskId`, error);
      throw new AppError('Failed to delete workspaces for task', { cause: error });
    }
  }
}
