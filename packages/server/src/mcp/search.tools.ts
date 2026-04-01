// External
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Services
import { searchService } from '../services/index.js';

export function registerSearchTools(server: McpServer) {
  server.registerTool(
    'search',
    {
      description: 'Full-text search across all entities (agents, skills, rules, memory, tasks, projects)',
      inputSchema: z.object({
        query: z.string().min(1).describe('Search query string'),
      }),
    },
    async ({ query }) => {
      const results = searchService.search(query);
      return { content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }] };
    },
  );
}
