// External
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Services
import { agentsService } from '../services/index.js';

export function registerAgentTools(server: McpServer) {
  server.registerTool(
    'list_agents',
    {
      description:
        'List all available AI agents with their id, name, and description. Optionally filter by projectId to return only agents assigned to that project.',
      inputSchema: z.object({
        projectId: z
          .string()
          .uuid()
          .optional()
          .describe('Optional project UUID to filter agents by project assignment'),
      }),
    },
    async ({ projectId }) => {
      const agents = projectId ? await agentsService.listByProject(projectId) : await agentsService.list();
      return { content: [{ type: 'text' as const, text: JSON.stringify(agents, null, 2) }] };
    },
  );

  server.registerTool(
    'get_agent',
    {
      description: 'Get full details of an agent by ID, including personality and unbreakable rules',
      inputSchema: z.object({
        id: z.string().uuid().describe('The agent UUID'),
      }),
    },
    async ({ id }) => {
      const agent = await agentsService.getById(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(agent, null, 2) }] };
    },
  );

  server.registerTool(
    'get_agent_context',
    {
      description:
        'Get complete agent context for bootstrapping: agent profile, global instructions, ' +
        'assigned skills, assigned rules, project-scoped skills/rules, and agent-scoped memories. ' +
        'Call this when starting work as an agent. Pass projectId for project-specific context.',
      inputSchema: z.object({
        agentId: z.string().uuid().describe('The agent UUID to load context for'),
        projectId: z
          .string()
          .uuid()
          .optional()
          .describe('Optional project UUID to include project-scoped skills and rules'),
      }),
    },
    async ({ agentId, projectId }) => {
      const context = await agentsService.getContext(agentId, projectId);
      return { content: [{ type: 'text' as const, text: JSON.stringify(context, null, 2) }] };
    },
  );
}
