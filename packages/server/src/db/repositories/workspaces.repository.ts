// NPM
import { eq } from 'drizzle-orm';
// DB
import type { DB } from '../index.js';
import { workspaces } from '../schema/index.js';
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

  findAll(): Workspace[] {
    const FUNCTION_NAME = 'findAll';
    try {
      return this.db.select().from(workspaces).all() as Workspace[];
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query workspaces', { cause: error });
    }
  }

  findByStatus(status: string): Workspace[] {
    const FUNCTION_NAME = 'findByStatus';
    try {
      return this.db
        .select()
        .from(workspaces)
        .where(eq(workspaces.status, status))
        .all() as Workspace[];
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
      return (row as Workspace) ?? null;
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to query workspace by task', { cause: error });
    }
  }

  findById(id: string): Workspace | null {
    const FUNCTION_NAME = 'findById';
    try {
      const row = this.db.select().from(workspaces).where(eq(workspaces.id, id)).get();
      return (row as Workspace) ?? null;
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
}
