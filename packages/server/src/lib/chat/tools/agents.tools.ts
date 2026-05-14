// External
import { z } from 'zod';

// Shared
import type { CreateAgent } from '@atlas/shared';

// Services
import { agentsService } from '../../../services/index.js';

// Lib
import { makeChatTool } from './registry.js';

export const createAgentTool = makeChatTool({
  name: 'create_agent',
  description: 'Create a new AI agent with a name, description, and personality.',
  mutating: true,
  inputSchema: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    personality: z.string().optional().describe('How the agent should behave'),
  }),
  handler: (input) => agentsService.create(input as CreateAgent),
});

export const listAgentsTool = makeChatTool({
  name: 'list_agents',
  description: 'List all configured AI agents.',
  mutating: false,
  inputSchema: z.object({}),
  handler: () => agentsService.list(),
});

export const agentTools = [createAgentTool, listAgentsTool];
