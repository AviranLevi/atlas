import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { agentsService } from '../services/index.js';

export function registerAgentTools(server: McpServer) {
  server.registerTool('list_agents', {
    description: 'List all available AI agents with their id, name, and description',
    inputSchema: z.object({}),
  }, async () => {
    const agents = await agentsService.list();
    return { content: [{ type: 'text' as const, text: JSON.stringify(agents, null, 2) }] };
  });

  server.registerTool('get_agent', {
    description: 'Get full details of an agent by ID, including personality and unbreakable rules',
    inputSchema: z.object({
      id: z.string().uuid().describe('The agent UUID'),
    }),
  }, async ({ id }) => {
    const agent = await agentsService.getById(id);
    return { content: [{ type: 'text' as const, text: JSON.stringify(agent, null, 2) }] };
  });

  server.registerTool('get_agent_context', {
    description:
      'Get complete agent context for bootstrapping: agent profile, global instructions, ' +
      'assigned skills, assigned rules, and agent-scoped memories. ' +
      'Call this when starting work as an agent.',
    inputSchema: z.object({
      agentId: z.string().uuid().describe('The agent UUID to load context for'),
    }),
  }, async ({ agentId }) => {
    const context = await agentsService.getContext(agentId);
    return { content: [{ type: 'text' as const, text: JSON.stringify(context, null, 2) }] };
  });
}
