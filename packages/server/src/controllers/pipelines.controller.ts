// External
import type { Context } from 'hono';

// Shared
import type {
  AddPipelineTasks,
  CreatePipeline,
  ReorderPipelineTasks,
  UpdatePipeline,
  UpdatePipelineTask,
  StartPipeline,
} from '@atlas/shared';

// Services
import { pipelinesService } from '../services/index.js';

// Lib
import { AppError } from '../lib/errors.js';
import { getValidatedBody } from '../lib/hono-helpers.js';

/** Lists all pipelines for a project. Requires projectId query param. */
export async function listPipelines(c: Context) {
  const projectId = c.req.query('projectId');
  if (!projectId) throw new AppError('projectId query param is required', { status: 400 });
  return c.json(await pipelinesService.list(projectId));
}

/** Returns a pipeline with all its tasks by ID. */
export async function getPipeline(c: Context) {
  return c.json(await pipelinesService.getById(c.req.param('id')!));
}

/** Creates a pipeline with an initial ordered task list. */
export async function createPipeline(c: Context) {
  const data = getValidatedBody<CreatePipeline>(c);
  return c.json(await pipelinesService.create(data), 201);
}

/** Renames or updates top-level pipeline fields. */
export async function updatePipeline(c: Context) {
  const data = getValidatedBody<UpdatePipeline>(c);
  return c.json(await pipelinesService.update(c.req.param('id')!, data));
}

/** Deletes a pipeline. */
export async function deletePipeline(c: Context) {
  await pipelinesService.remove(c.req.param('id')!);
  return c.body(null, 204);
}

/** Appends tasks to an existing pipeline. */
export async function addPipelineTasks(c: Context) {
  const data = getValidatedBody<AddPipelineTasks>(c);
  return c.json(await pipelinesService.addTasks(c.req.param('id')!, data));
}

/** Updates per-task settings (autoReview, autoAccept, baseStrategy). */
export async function updatePipelineTask(c: Context) {
  const data = getValidatedBody<UpdatePipelineTask>(c);
  return c.json(await pipelinesService.updateTask(c.req.param('id')!, c.req.param('taskId')!, data));
}

/** Removes a task from a pipeline. */
export async function removePipelineTask(c: Context) {
  return c.json(await pipelinesService.removeTask(c.req.param('id')!, c.req.param('taskId')!));
}

/** Reorders tasks in a pipeline. */
export async function reorderPipelineTasks(c: Context) {
  const data = getValidatedBody<ReorderPipelineTasks>(c);
  return c.json(await pipelinesService.reorderTasks(c.req.param('id')!, data));
}

/** Starts a pipeline (spawns first queued task). */
export async function startPipeline(c: Context) {
  const { agentRuntimeId } = getValidatedBody<StartPipeline>(c);
  return c.json(await pipelinesService.start(c.req.param('id')!, agentRuntimeId));
}

/** Pauses a running pipeline (current task keeps running, next won't start). */
export async function pausePipeline(c: Context) {
  return c.json(await pipelinesService.pause(c.req.param('id')!));
}

/** Resumes a paused pipeline. */
export async function resumePipeline(c: Context) {
  const { agentRuntimeId } = getValidatedBody<StartPipeline>(c);
  return c.json(await pipelinesService.resume(c.req.param('id')!, agentRuntimeId));
}

/** Cancels a pipeline — stops current workspace, skips remaining tasks. */
export async function cancelPipeline(c: Context) {
  return c.json(await pipelinesService.cancel(c.req.param('id')!));
}
