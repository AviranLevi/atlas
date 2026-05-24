// External
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Services
import { automationsService } from '../services/index.js';

export function registerAutomationTools(server: McpServer): void {
  server.registerTool(
    'list_automations',
    {
      description: 'List automations, optionally filtered by project ID',
      inputSchema: z.object({
        projectId: z.string().uuid().optional().describe('Filter by project (also returns global automations)'),
      }),
    },
    async (filters) => {
      const result = await automationsService.list(filters.projectId ? { projectId: filters.projectId } : undefined);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    'get_automation',
    {
      description: 'Get automation details by ID',
      inputSchema: z.object({
        id: z.string().uuid().describe('The automation UUID'),
      }),
    },
    async ({ id }) => {
      const automation = await automationsService.getById(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(automation, null, 2) }] };
    },
  );

  server.registerTool(
    'run_automation',
    {
      description: 'Run an automation — creates a task and starts a workspace with the configured agent',
      inputSchema: z.object({
        id: z.string().uuid().describe('The automation UUID'),
        projectId: z.string().uuid().describe('The project to run the automation in'),
      }),
    },
    async ({ id, projectId }) => {
      const workspace = await automationsService.runAutomation(id, projectId);
      return { content: [{ type: 'text' as const, text: JSON.stringify(workspace, null, 2) }] };
    },
  );
}
