// External
import { z } from 'zod';

// Shared
import type { CreateTask } from '@atlas/shared';

// Services
import { pipelinesService, tasksService } from '../../../services/index.js';

// Lib
import { makeChatTool } from './registry.js';

const PIPELINE_TASK_SCHEMA = z.object({
  name: z.string().min(1).describe('Task name'),
  notes: z.string().optional().describe('Task description or notes'),
  definitionOfDone: z.string().optional().describe('Acceptance criteria'),
  agentId: z
    .string()
    .uuid()
    .optional()
    .describe('UUID of the agent to assign to this task. Use the ID from list_agents.'),
});

export const createPipelineTool = makeChatTool({
  name: 'create_pipeline',
  description:
    'Create a pipeline (sequential task execution chain) from a list of task names. ' +
    'Creates each task on the kanban board and assembles them into an ordered pipeline. ' +
    'Tasks run one after another — each starts when the previous is approved.',
  mutating: true,
  inputSchema: z.object({
    name: z.string().min(1).describe('Pipeline name (e.g. "Build REST API")'),
    tasks: z.array(PIPELINE_TASK_SCHEMA).min(1).describe('Ordered list of tasks — they will execute sequentially'),
  }),
  handler: async (input, context) => {
    if (!context.projectId) return { error: 'No project selected — cannot create pipeline.' };

    const created = await Promise.all(
      input.tasks.map((t) =>
        tasksService.create({
          ...t,
          projectId: context.projectId!,
        } as CreateTask),
      ),
    );

    const pipeline = await pipelinesService.create({
      projectId: context.projectId,
      name: input.name,
      tasks: created.map((task) => ({
        taskId: task.id,
        autoReview: false,
        autoAccept: false,
        baseStrategy: 'previous' as const,
      })),
    });

    return {
      pipelineId: pipeline.id,
      name: pipeline.name,
      taskCount: pipeline.tasks.length,
      tasks: pipeline.tasks.map((pt) => ({ taskId: pt.taskId, position: pt.position })),
    };
  },
});

export const pipelineTools = [createPipelineTool];
