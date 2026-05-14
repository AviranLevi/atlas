// External
import { z } from 'zod';

// Services
import { searchService } from '../../../services/index.js';

// Lib
import { makeChatTool } from './registry.js';

export const searchTool = makeChatTool({
  name: 'search',
  description: 'Full-text search across all entities (tasks, agents, rules, skills, memory, projects).',
  mutating: false,
  inputSchema: z.object({
    query: z.string().min(1).describe('Search query'),
  }),
  handler: (input) => searchService.search(input.query),
});

export const searchTools = [searchTool];
