// External
import { asc, desc, eq } from 'drizzle-orm';

// Shared
import type { Workspace } from '@atlas/shared';

// DB
import type { DB } from '../../index.js';
import { projects, tasks, workspaces } from '../../schema/index.js';

// Lib
import { NotFoundError } from '../../../lib/errors.js';
import { withAppErrorSync } from '../../../lib/with-app-error.js';

// Local
import type { InsertWorkspace, UpdateWorkspace, WorkspaceJoinRow } from './workspaces.repository.types.js';

const FILE_PATH = 'db/repositories/workspaces/workspaces.repository.ts';

export class WorkspacesRepository {
  constructor(private readonly db: DB) {}

  private parseComments(raw: string | null | undefined): Workspace['diffComments'] {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private enrichRow(row: WorkspaceJoinRow): Workspace {
    return {
      ...(row.workspaces as unknown as Workspace),
      diffComments: this.parseComments(row.workspaces.diffComments),
      taskName: row.tasks?.name ?? undefined,
      projectName: row.projects?.name ?? undefined,
    };
  }

  /** Returns all workspaces enriched with task and project names. */
  findAll(): Workspace[] {
    return withAppErrorSync(
      () => {
        const rows = this.db
          .select()
          .from(workspaces)
          .leftJoin(tasks, eq(workspaces.taskId, tasks.id))
          .leftJoin(projects, eq(workspaces.projectId, projects.id))
          .all();
        return rows.map((r) => this.enrichRow(r));
      },
      { filePath: FILE_PATH, functionName: 'findAll', message: 'Failed to query workspaces' },
    );
  }

  /** Returns workspaces by status, enriched with task and project names. */
  findByStatus(status: string): Workspace[] {
    return withAppErrorSync(
      () => {
        const rows = this.db
          .select()
          .from(workspaces)
          .leftJoin(tasks, eq(workspaces.taskId, tasks.id))
          .leftJoin(projects, eq(workspaces.projectId, projects.id))
          .where(eq(workspaces.status, status))
          .all();
        return rows.map((r) => this.enrichRow(r));
      },
      {
        filePath: FILE_PATH,
        functionName: 'findByStatus',
        message: 'Failed to query workspaces by status',
      },
    );
  }

  /** Returns all workspaces for a task, ordered by createdAt ascending. */
  findAllByTaskId(taskId: string): Workspace[] {
    return withAppErrorSync(
      () => {
        const rows = this.db
          .select()
          .from(workspaces)
          .where(eq(workspaces.taskId, taskId))
          .orderBy(asc(workspaces.createdAt))
          .all();
        return rows.map((r) => ({ ...r, diffComments: this.parseComments(r.diffComments) }) as Workspace);
      },
      {
        filePath: FILE_PATH,
        functionName: 'findAllByTaskId',
        message: 'Failed to query workspaces by task',
      },
    );
  }

  /** Returns the most recently created workspace for a task, or null. */
  findLatestByTask(taskId: string): Workspace | null {
    return withAppErrorSync(
      () => {
        const rows = this.db
          .select()
          .from(workspaces)
          .leftJoin(tasks, eq(workspaces.taskId, tasks.id))
          .leftJoin(projects, eq(workspaces.projectId, projects.id))
          .where(eq(workspaces.taskId, taskId))
          .orderBy(desc(workspaces.createdAt))
          .all();
        if (rows.length === 0) return null;
        return this.enrichRow(rows[0]);
      },
      {
        filePath: FILE_PATH,
        functionName: 'findLatestByTask',
        message: 'Failed to query latest workspace by task',
      },
    );
  }

  /** Returns the workspace for a task, or null if not found. */
  findByTaskId(taskId: string): Workspace | null {
    return withAppErrorSync(
      () => {
        const row = this.db.select().from(workspaces).where(eq(workspaces.taskId, taskId)).get();
        if (!row) return null;
        return { ...row, diffComments: this.parseComments(row.diffComments) } as Workspace;
      },
      {
        filePath: FILE_PATH,
        functionName: 'findByTaskId',
        message: 'Failed to query workspace by task',
      },
    );
  }

  /** Returns child workspaces of a given parent, ordered newest first. */
  findByParentId(parentId: string): Workspace[] {
    return withAppErrorSync(
      () => {
        const rows = this.db
          .select()
          .from(workspaces)
          .where(eq(workspaces.parentWorkspaceId, parentId))
          .orderBy(desc(workspaces.createdAt))
          .all();
        return rows.map((r) => ({ ...r, diffComments: this.parseComments(r.diffComments) }) as Workspace);
      },
      {
        filePath: FILE_PATH,
        functionName: 'findByParentId',
        message: 'Failed to query child workspaces',
      },
    );
  }

  /** Walks the parent chain from a workspace back to the root, returning the full lineage (oldest first). */
  findLineage(workspaceId: string): Workspace[] {
    return withAppErrorSync(
      () => {
        const chain: Workspace[] = [];
        let currentId: string | null = workspaceId;
        while (currentId) {
          const ws = this.findByIdOrThrow(currentId);
          chain.unshift(ws);
          currentId = ws.parentWorkspaceId ?? null;
        }
        return chain;
      },
      {
        filePath: FILE_PATH,
        functionName: 'findLineage',
        message: 'Failed to build workspace lineage',
      },
    );
  }

  /** Returns a workspace by ID enriched with task/project names, or null. */
  findById(id: string): Workspace | null {
    return withAppErrorSync(
      () => {
        const row = this.db
          .select()
          .from(workspaces)
          .leftJoin(tasks, eq(workspaces.taskId, tasks.id))
          .leftJoin(projects, eq(workspaces.projectId, projects.id))
          .where(eq(workspaces.id, id))
          .get();
        if (!row) return null;
        return this.enrichRow(row);
      },
      { filePath: FILE_PATH, functionName: 'findById', message: 'Failed to query workspace' },
    );
  }

  /** Returns a workspace by ID enriched with task/project names, or throws NotFoundError. */
  findByIdOrThrow(id: string): Workspace {
    const row = this.findById(id);
    if (!row) {
      throw new NotFoundError('Workspace', id);
    }
    return row;
  }

  /** Inserts a new workspace and returns the created record. */
  insert(data: InsertWorkspace): Workspace {
    return withAppErrorSync(() => this.db.insert(workspaces).values(data).returning().get() as Workspace, {
      filePath: FILE_PATH,
      functionName: 'insert',
      message: 'Failed to insert workspace',
    });
  }

  /** Updates a workspace and returns the updated record. */
  update(id: string, data: UpdateWorkspace): Workspace {
    return withAppErrorSync(
      () =>
        this.db
          .update(workspaces)
          .set({ ...data, updatedAt: new Date().toISOString() })
          .where(eq(workspaces.id, id))
          .returning()
          .get() as Workspace,
      { filePath: FILE_PATH, functionName: 'update', message: 'Failed to update workspace' },
    );
  }

  /** Deletes a workspace by ID. */
  remove(id: string): void {
    withAppErrorSync(
      () => {
        this.db.delete(workspaces).where(eq(workspaces.id, id)).run();
      },
      { filePath: FILE_PATH, functionName: 'remove', message: 'Failed to delete workspace' },
    );
  }

  /** Deletes all workspaces for a task. */
  removeByTaskId(taskId: string): void {
    withAppErrorSync(
      () => {
        this.db.delete(workspaces).where(eq(workspaces.taskId, taskId)).run();
      },
      {
        filePath: FILE_PATH,
        functionName: 'removeByTaskId',
        message: 'Failed to delete workspaces for task',
      },
    );
  }
}
