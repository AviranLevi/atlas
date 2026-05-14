// External
import { and, asc, eq } from 'drizzle-orm';

// Shared
import type { Pipeline, PipelineTask, PipelineWithTasks } from '@atlas/shared';

// DB
import type { DB } from '../../index.js';
import { agents, pipelines, pipelineTasks, tasks, workspaces } from '../../schema/index.js';

// Lib
import { NotFoundError } from '../../../lib/errors.js';
import { withAppErrorSync } from '../../../lib/with-app-error.js';

// Local
import type {
  InsertPipeline,
  InsertPipelineTask,
  PipelineTaskJoinRow,
  UpdatePipeline,
  UpdatePipelineTask,
} from './pipelines.repository.types.js';

const FILE_PATH = 'db/repositories/pipelines/pipelines.repository.ts';

export class PipelinesRepository {
  constructor(private readonly db: DB) {}

  private rowToPipeline(row: typeof pipelines.$inferSelect): Pipeline {
    return row as unknown as Pipeline;
  }

  private taskRowToTask(row: PipelineTaskJoinRow): PipelineTask {
    return {
      ...(row.pipeline_tasks as unknown as PipelineTask),
      taskName: row.tasks?.name ?? undefined,
      taskStatus: row.tasks?.status ?? undefined,
      agentId: row.tasks?.agentId ?? undefined,
      agentName: row.agents?.name ?? undefined,
      workflowEnabled: row.tasks?.workflowEnabled ?? undefined,
      workflowStage: row.tasks?.workflowStage ?? undefined,
      workspaceRuntime: row.workspaces?.agentRuntime ?? undefined,
      workspaceModel: row.workspaces?.model ?? undefined,
      workspaceStage: row.workspaces?.workflowStage ?? undefined,
      workspaceStatus: row.workspaces?.status ?? undefined,
      agentDefaultRuntimeId: row.agents?.defaultRuntimeId ?? undefined,
    };
  }

  /** Returns all pipelines for a project. */
  findByProject(projectId: string): Pipeline[] {
    return withAppErrorSync(
      () =>
        this.db
          .select()
          .from(pipelines)
          .where(eq(pipelines.projectId, projectId))
          .orderBy(asc(pipelines.createdAt))
          .all()
          .map(this.rowToPipeline),
      { filePath: FILE_PATH, functionName: 'findByProject', message: 'Failed to find pipelines' },
    );
  }

  /** Returns a pipeline by ID or null. */
  findById(id: string): Pipeline | null {
    return withAppErrorSync(
      () => {
        const row = this.db.select().from(pipelines).where(eq(pipelines.id, id)).get();
        return row ? this.rowToPipeline(row) : null;
      },
      { filePath: FILE_PATH, functionName: 'findById', message: 'Failed to find pipeline' },
    );
  }

  /** Returns a pipeline by ID or throws NotFoundError. */
  findByIdOrThrow(id: string): Pipeline {
    const pipeline = this.findById(id);
    if (!pipeline) throw new NotFoundError('Pipeline', id);
    return pipeline;
  }

  /** Returns all pipeline tasks for a pipeline, ordered by position, enriched with task/agent/workspace data. */
  findTasks(pipelineId: string): PipelineTask[] {
    return withAppErrorSync(
      () =>
        this.db
          .select()
          .from(pipelineTasks)
          .leftJoin(tasks, eq(pipelineTasks.taskId, tasks.id))
          .leftJoin(agents, eq(tasks.agentId, agents.id))
          .leftJoin(workspaces, eq(pipelineTasks.workspaceId, workspaces.id))
          .where(eq(pipelineTasks.pipelineId, pipelineId))
          .orderBy(asc(pipelineTasks.position))
          .all()
          .map((row) => this.taskRowToTask(row as PipelineTaskJoinRow)),
      { filePath: FILE_PATH, functionName: 'findTasks', message: 'Failed to find pipeline tasks' },
    );
  }

  /** Returns a pipeline with all its tasks. */
  findWithTasks(id: string): PipelineWithTasks | null {
    const pipeline = this.findById(id);
    if (!pipeline) return null;
    const pTasks = this.findTasks(id);
    return { ...pipeline, tasks: pTasks };
  }

  /** Returns the pipeline task entry by pipelineId + taskId, or null. */
  findTask(pipelineId: string, taskId: string): PipelineTask | null {
    return withAppErrorSync(
      () => {
        const row = this.db
          .select()
          .from(pipelineTasks)
          .leftJoin(tasks, eq(pipelineTasks.taskId, tasks.id))
          .leftJoin(agents, eq(tasks.agentId, agents.id))
          .leftJoin(workspaces, eq(pipelineTasks.workspaceId, workspaces.id))
          .where(eq(pipelineTasks.pipelineId, pipelineId))
          .all()
          .find((r) => r.pipeline_tasks.taskId === taskId);
        return row ? this.taskRowToTask(row as PipelineTaskJoinRow) : null;
      },
      { filePath: FILE_PATH, functionName: 'findTask', message: 'Failed to find pipeline task' },
    );
  }

  /** Returns the pipeline task entry by workspaceId, or null. */
  findTaskByWorkspace(workspaceId: string): PipelineTask | null {
    return withAppErrorSync(
      () => {
        const row = this.db
          .select()
          .from(pipelineTasks)
          .leftJoin(tasks, eq(pipelineTasks.taskId, tasks.id))
          .leftJoin(agents, eq(tasks.agentId, agents.id))
          .leftJoin(workspaces, eq(pipelineTasks.workspaceId, workspaces.id))
          .where(eq(pipelineTasks.workspaceId, workspaceId))
          .get();
        return row ? this.taskRowToTask(row as PipelineTaskJoinRow) : null;
      },
      {
        filePath: FILE_PATH,
        functionName: 'findTaskByWorkspace',
        message: 'Failed to find pipeline task by workspace',
      },
    );
  }

  /** Inserts a pipeline and returns the created record. */
  insert(data: InsertPipeline): Pipeline {
    return withAppErrorSync(
      () =>
        this.rowToPipeline(
          this.db
            .insert(pipelines)
            .values({
              ...data,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returning()
            .get(),
        ),
      { filePath: FILE_PATH, functionName: 'insert', message: 'Failed to insert pipeline' },
    );
  }

  /** Updates a pipeline and returns the updated record. */
  update(id: string, data: UpdatePipeline): Pipeline {
    return withAppErrorSync(
      () =>
        this.rowToPipeline(
          this.db
            .update(pipelines)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where(eq(pipelines.id, id))
            .returning()
            .get() as typeof pipelines.$inferSelect,
        ),
      { filePath: FILE_PATH, functionName: 'update', message: 'Failed to update pipeline' },
    );
  }

  /** Deletes a pipeline by ID. */
  remove(id: string): void {
    withAppErrorSync(
      () => {
        this.db.delete(pipelines).where(eq(pipelines.id, id)).run();
      },
      { filePath: FILE_PATH, functionName: 'remove', message: 'Failed to delete pipeline' },
    );
  }

  /** Inserts multiple pipeline task rows. */
  insertTasks(rows: InsertPipelineTask[]): void {
    withAppErrorSync(
      () => {
        this.db.insert(pipelineTasks).values(rows).run();
      },
      { filePath: FILE_PATH, functionName: 'insertTasks', message: 'Failed to insert pipeline tasks' },
    );
  }

  /** Updates a pipeline task entry. */
  updateTask(pipelineId: string, taskId: string, data: UpdatePipelineTask): void {
    withAppErrorSync(
      () => {
        this.db
          .update(pipelineTasks)
          .set(data)
          .where(and(eq(pipelineTasks.pipelineId, pipelineId), eq(pipelineTasks.taskId, taskId)))
          .run();
      },
      { filePath: FILE_PATH, functionName: 'updateTask', message: 'Failed to update pipeline task' },
    );
  }

  /** Removes a single task from a pipeline. */
  removeTask(pipelineId: string, taskId: string): void {
    withAppErrorSync(
      () => {
        this.db
          .delete(pipelineTasks)
          .where(and(eq(pipelineTasks.pipelineId, pipelineId), eq(pipelineTasks.taskId, taskId)))
          .run();
      },
      { filePath: FILE_PATH, functionName: 'removeTask', message: 'Failed to remove pipeline task' },
    );
  }

  /** Replaces all tasks for a pipeline (used for reordering). */
  replaceTasks(pipelineId: string, rows: InsertPipelineTask[]): void {
    withAppErrorSync(
      () => {
        this.db.delete(pipelineTasks).where(eq(pipelineTasks.pipelineId, pipelineId)).run();
        if (rows.length > 0) {
          this.db.insert(pipelineTasks).values(rows).run();
        }
      },
      { filePath: FILE_PATH, functionName: 'replaceTasks', message: 'Failed to replace pipeline tasks' },
    );
  }
}
