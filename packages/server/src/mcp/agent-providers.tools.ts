// External
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Services
import { agentProvidersService } from '../services/index.js';

export function registerAgentProviderTools(server: McpServer) {
  server.registerTool(
    'list_providers',
    {
      description: 'List all configured AI providers (Anthropic, OpenAI, Ollama, Google, etc.)',
      inputSchema: z.object({}),
    },
    async () => {
      const providers = await agentProvidersService.list();
      return { content: [{ type: 'text' as const, text: JSON.stringify(providers, null, 2) }] };
    },
  );

  server.registerTool(
    'get_provider',
    {
      description: 'Get details for a specific AI provider by ID',
      inputSchema: z.object({
        id: z.string().uuid().describe('The provider UUID'),
      }),
    },
    async ({ id }) => {
      const provider = await agentProvidersService.getById(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(provider, null, 2) }] };
    },
  );

  server.registerTool(
    'list_provider_models',
    {
      description: 'List available models for a specific provider',
      inputSchema: z.object({
        id: z.string().uuid().describe('The provider UUID'),
      }),
    },
    async ({ id }) => {
      const models = await agentProvidersService.listModels(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(models, null, 2) }] };
    },
  );
}
