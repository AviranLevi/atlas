// External
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Shared
import { MemoryScopeEnum, MemoryStatusEnum, MemoryTypeEnum } from '@atlas/shared';

// Services
import { memoryService } from '../services/index.js';

// Lib
import { logger } from '../lib/logger.js';

export function registerMemoryTools(server: McpServer): void {
  server.registerTool(
    'list_memories',
    {
      description: 'List memory entries with optional filters by scope, type, projectId, or agentId',
      inputSchema: z.object({
        scope: MemoryScopeEnum.optional().describe('Filter by memory scope'),
        type: MemoryTypeEnum.optional().describe('Filter by memory type'),
        projectId: z.string().uuid().optional().describe('Filter by project UUID'),
        agentId: z.string().uuid().optional().describe('Filter by agent UUID'),
      }),
    },
    async (filters) => {
      const result = await memoryService.list(filters);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    'create_memory',
    {
      description:
        'Store a new memory entry (decision, convention, preference, or problem). ' +
        'Use this to persist learnings, decisions, or conventions discovered during work. ' +
        'If this memory replaces an outdated one, pass supersedesId to automatically mark the old one as superseded.',
      inputSchema: z.object({
        name: z.string().min(1).max(200).describe('Memory name/title'),
        content: z.string().min(1).describe('Memory content'),
        type: MemoryTypeEnum.describe('Memory type'),
        scope: MemoryScopeEnum.optional().describe('Scope (defaults to "project")'),
        isPinned: z.boolean().optional().describe('Pin this memory so it always loads in agent context'),
        projectId: z.string().uuid().optional().describe('Associated project UUID'),
        agentId: z.string().uuid().optional().describe('Associated agent UUID'),
        supersedesId: z
          .string()
          .uuid()
          .optional()
          .describe('UUID of the memory this replaces — the old memory will be marked as superseded'),
      }),
    },
    async (args) => {
      const entry = await memoryService.create({
        ...args,
        scope: args.scope ?? MemoryScopeEnum.Enum.project,
      });
      logger.info(`[MCP] create_memory: id=${entry.id}, name="${entry.name}"`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(entry, null, 2) }] };
    },
  );

  server.registerTool(
    'update_memory',
    {
      description: 'Update an existing memory entry by ID. Can also archive a memory by setting status to "archived".',
      inputSchema: z.object({
        id: z.string().uuid().describe('The memory UUID to update'),
        name: z.string().min(1).max(200).optional().describe('Updated name'),
        content: z.string().min(1).optional().describe('Updated content'),
        type: MemoryTypeEnum.optional().describe('Updated type'),
        status: MemoryStatusEnum.optional().describe('Updated status — use "archived" to retire a memory'),
        isPinned: z.boolean().optional().describe('Whether this memory should always load in agent context'),
      }),
    },
    async ({ id, ...data }) => {
      const entry = await memoryService.update(id, data);
      return { content: [{ type: 'text' as const, text: JSON.stringify(entry, null, 2) }] };
    },
  );

  server.registerTool(
    'supersede_memory',
    {
      description:
        'Replace a stale memory with updated information in a single operation. ' +
        'The old memory is marked as superseded and linked to the new one. ' +
        'Use this when a fact has changed and you want to preserve the history.',
      inputSchema: z.object({
        id: z.string().uuid().describe('UUID of the memory to supersede'),
        name: z.string().min(1).max(200).describe('Name for the replacement memory'),
        content: z.string().min(1).describe('Updated content for the replacement memory'),
        type: MemoryTypeEnum.describe('Type for the replacement memory'),
      }),
    },
    async ({ id, name, content, type }) => {
      const newMem = await memoryService.supersede(id, { name, content, type });
      logger.info(`[MCP] supersede_memory: old=${id}, new=${newMem.id}, name="${newMem.name}"`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(newMem, null, 2) }] };
    },
  );
}
