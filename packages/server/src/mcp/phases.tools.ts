import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { phasesService } from '../services/index.js';

export function registerPhaseTools(server: McpServer) {
  server.registerTool('list_phases', {
    description: 'List development phases/milestones for a project with task counts and progress',
    inputSchema: z.object({
      projectId: z.string().uuid().describe('The project UUID'),
    }),
  }, async ({ projectId }) => {
    const phases = await phasesService.list(projectId);
    return { content: [{ type: 'text' as const, text: JSON.stringify(phases, null, 2) }] };
  });

  server.registerTool('get_phase', {
    description: 'Get a single phase by ID including task count and progress percentage',
    inputSchema: z.object({
      id: z.string().uuid().describe('The phase UUID'),
    }),
  }, async ({ id }) => {
    const phase = await phasesService.getById(id);
    const progress = phasesService.getProgress(phase);
    return { content: [{ type: 'text' as const, text: JSON.stringify({ ...phase, progress }, null, 2) }] };
  });
}
