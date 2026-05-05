// External
import { Hono } from 'hono';

// Shared
import {
  AddPipelineTasksSchema,
  CreatePipelineSchema,
  ReorderPipelineTasksSchema,
  StartPipelineSchema,
  UpdatePipelineSchema,
  UpdatePipelineTaskSchema,
} from '@atlas/shared';
import { zValidator } from '@hono/zod-validator';

// Controllers
import {
  addPipelineTasks,
  cancelPipeline,
  createPipeline,
  deletePipeline,
  getPipeline,
  listPipelines,
  pausePipeline,
  removePipelineTask,
  reorderPipelineTasks,
  resumePipeline,
  startPipeline,
  updatePipeline,
  updatePipelineTask,
} from '../controllers/pipelines.controller.js';

export const pipelinesRoute = new Hono()
  .get('/', listPipelines)
  .post('/', zValidator('json', CreatePipelineSchema), createPipeline)
  .get('/:id', getPipeline)
  .patch('/:id', zValidator('json', UpdatePipelineSchema), updatePipeline)
  .delete('/:id', deletePipeline)
  .post('/:id/tasks', zValidator('json', AddPipelineTasksSchema), addPipelineTasks)
  .patch('/:id/tasks/:taskId', zValidator('json', UpdatePipelineTaskSchema), updatePipelineTask)
  .delete('/:id/tasks/:taskId', removePipelineTask)
  .post('/:id/tasks/reorder', zValidator('json', ReorderPipelineTasksSchema), reorderPipelineTasks)
  .post('/:id/start', zValidator('json', StartPipelineSchema), startPipeline)
  .post('/:id/pause', pausePipeline)
  .post('/:id/resume', zValidator('json', StartPipelineSchema), resumePipeline)
  .post('/:id/cancel', cancelPipeline);
