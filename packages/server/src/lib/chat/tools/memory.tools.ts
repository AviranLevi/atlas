// External
import { z } from 'zod';

// Shared
import type { CreateMemory } from '@atlas/shared';
import { MemoryTypeEnum, MemoryScopeEnum } from '@atlas/shared';

// Services
import { memoryService } from '../../../services/index.js';

// Lib
import { makeChatTool } from './registry.js';

export const createMemoryTool = makeChatTool({
  name: 'create_memory',
  description: 'Save a decision, convention, preference, or problem as a memory entry for future reference.',
  mutating: true,
  inputSchema: z.object({
    name: z.string().min(1).describe('Short title for the memory'),
    type: MemoryTypeEnum,
    content: z.string().describe('Detailed description'),
    scope: MemoryScopeEnum.describe('Whether this applies globally or to the current project'),
  }),
  handler: (input, context) => {
    if (input.scope === 'project' && !context.projectId) {
      return { error: 'No project selected for project-scoped memory' };
    }
    return memoryService.create({
      name: input.name,
      type: input.type,
      content: input.content,
      scope: input.scope,
      projectId: input.scope === 'project' ? context.projectId! : null,
    } as CreateMemory);
  },
});

export const listMemoriesTool = makeChatTool({
  name: 'list_memories',
  description: 'List project memories (decisions, conventions, preferences, problems).',
  mutating: false,
  inputSchema: z.object({}),
  handler: (_, context) => {
    if (!context.projectId) return [];
    return memoryService.listByProject(context.projectId);
  },
});

export const memoryTools = [createMemoryTool, listMemoriesTool];
