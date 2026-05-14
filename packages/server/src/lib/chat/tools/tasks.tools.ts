// External
import { z } from 'zod';

// Shared
import type { CreateTask, UpdateTask } from '@atlas/shared';
import { TaskEstimateEnum, TaskPriorityEnum, TaskStatusEnum } from '@atlas/shared';

// Services
import { tasksService } from '../../../services/index.js';

// Lib
import { makeChatTool } from './registry.js';

export const createTaskTool = makeChatTool({
  name: 'create_task',
  description: 'Create a new task on the kanban board.',
  mutating: true,
  inputSchema: z.object({
    name: z.string().min(1).describe('Task name/title'),
    status: TaskStatusEnum.optional().describe('Initial status'),
    priority: TaskPriorityEnum.optional(),
    estimate: TaskEstimateEnum.optional(),
    notes: z.string().optional().describe('Additional notes'),
    definitionOfDone: z.string().optional().describe('Acceptance criteria'),
    agentId: z
      .string()
      .uuid()
      .optional()
      .describe('UUID of the agent to assign. Use the ID from a tagged @mention or from list_agents.'),
  }),
  handler: (input, context) =>
    tasksService.create({ ...input, projectId: context.projectId ?? undefined } as CreateTask),
});

export const listTasksTool = makeChatTool({
  name: 'list_tasks',
  description: 'List tasks, optionally filtered by status or project.',
  mutating: false,
  inputSchema: z.object({
    status: TaskStatusEnum.optional().describe('Filter by status'),
  }),
  handler: (input, context) =>
    tasksService.list({
      ...(input.status ? { status: input.status } : {}),
      ...(context.projectId ? { projectId: context.projectId } : {}),
    }),
});

export const updateTaskTool = makeChatTool({
  name: 'update_task',
  description: 'Update an existing task (status, notes, priority, agent assignment, etc).',
  mutating: true,
  inputSchema: z.object({
    id: z.string().describe('Task ID (UUID)'),
    name: z.string().optional(),
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    notes: z.string().optional(),
    agentId: z
      .string()
      .nullable()
      .optional()
      .describe('UUID of the agent to assign. Use the ID from list_agents. Set to null to unassign.'),
    definitionOfDone: z.string().optional().describe('Acceptance criteria'),
  }),
  handler: ({ id, ...rest }) => tasksService.update(id, rest as UpdateTask),
});

export const taskTools = [createTaskTool, listTasksTool, updateTaskTool];
