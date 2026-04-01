// External
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Shared
import { TASK_STATUS, TaskEstimateEnum, TaskPriorityEnum, TaskStatusEnum } from '@atlas/shared';

// Services
import { tasksService } from '../services/index.js';

export function registerTaskTools(server: McpServer): void {
  server.registerTool(
    'list_tasks',
    {
      description: 'List tasks with optional filters by status, projectId, or agentId',
      inputSchema: z.object({
        status: TaskStatusEnum.optional().describe('Filter by task status'),
        projectId: z.string().uuid().optional().describe('Filter by project UUID'),
        agentId: z.string().uuid().optional().describe('Filter by assigned agent UUID'),
      }),
    },
    async (filters) => {
      const result = await tasksService.list(filters);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    'get_task',
    {
      description: 'Get full task details by ID including definition of done, notes, and assignments',
      inputSchema: z.object({
        id: z.string().uuid().describe('The task UUID'),
      }),
    },
    async ({ id }) => {
      const task = await tasksService.getById(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(task, null, 2) }] };
    },
  );

  server.registerTool(
    'create_task',
    {
      description: 'Create a new task on the Kanban board',
      inputSchema: z.object({
        name: z.string().min(1).max(200).describe('Task name'),
        status: TaskStatusEnum.optional().describe('Initial status (defaults to "To Do")'),
        priority: TaskPriorityEnum.optional().describe('Task priority'),
        estimate: TaskEstimateEnum.optional().describe('Size estimate'),
        definitionOfDone: z.string().optional().describe('Criteria for task completion'),
        notes: z.string().optional().describe('Additional notes or context'),
        projectId: z.string().uuid().optional().describe('Assign to a project'),
        agentId: z.string().uuid().optional().describe('Assign to an agent'),
      }),
    },
    async (args) => {
      const task = await tasksService.create({
        ...args,
        status: args.status ?? TASK_STATUS.TODO,
        source: 'agent',
      });
      return { content: [{ type: 'text' as const, text: JSON.stringify(task, null, 2) }] };
    },
  );

  server.registerTool(
    'update_task',
    {
      description:
        'Update a task by ID. Use this to move tasks through the Kanban ' +
        '(e.g. set status to "In Progress" or "Done"), add notes, or reassign.',
      inputSchema: z.object({
        id: z.string().uuid().describe('The task UUID to update'),
        name: z.string().min(1).max(200).optional().describe('Updated task name'),
        status: TaskStatusEnum.optional().describe('New status'),
        priority: TaskPriorityEnum.optional().describe('Updated priority'),
        estimate: TaskEstimateEnum.optional().describe('Updated estimate'),
        definitionOfDone: z.string().optional().describe('Updated completion criteria'),
        notes: z.string().optional().describe('Updated notes'),
        projectId: z.string().uuid().nullable().optional().describe('Reassign project'),
        agentId: z.string().uuid().nullable().optional().describe('Reassign agent'),
      }),
    },
    async ({ id, ...data }) => {
      const task = await tasksService.update(id, data);
      return { content: [{ type: 'text' as const, text: JSON.stringify(task, null, 2) }] };
    },
  );
}
