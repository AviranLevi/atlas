// External
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Services
import { quickActionsService } from '../services/index.js';

export function registerQuickActionTools(server: McpServer): void {
  server.registerTool(
    'list_quick_actions',
    {
      description: 'List quick actions, optionally filtered by project ID',
      inputSchema: z.object({
        projectId: z.string().uuid().optional().describe('Filter by project (also returns global quick actions)'),
      }),
    },
    async (filters) => {
      const result = await quickActionsService.list(filters.projectId ? { projectId: filters.projectId } : undefined);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    'get_quick_action',
    {
      description: 'Get quick action details by ID',
      inputSchema: z.object({
        id: z.string().uuid().describe('The quick action UUID'),
      }),
    },
    async ({ id }) => {
      const quickAction = await quickActionsService.getById(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(quickAction, null, 2) }] };
    },
  );

  server.registerTool(
    'run_quick_action',
    {
      description: 'Run a quick action — creates a task and starts a workspace with the configured agent',
      inputSchema: z.object({
        id: z.string().uuid().describe('The quick action UUID'),
        projectId: z.string().uuid().describe('The project to run the quick action in'),
      }),
    },
    async ({ id, projectId }) => {
      const workspace = await quickActionsService.runQuickAction(id, projectId);
      return { content: [{ type: 'text' as const, text: JSON.stringify(workspace, null, 2) }] };
    },
  );
}
