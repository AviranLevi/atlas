import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MemoryTypeEnum, MemoryScopeEnum } from '@atlas/shared';
import { memoryService } from '../services/index.js';
import { logger } from '../lib/logger.js';

export function registerMemoryTools(server: McpServer): void {
  server.registerTool('list_memories', {
    description: 'List memory entries with optional filters by scope, type, projectId, or agentId',
    inputSchema: z.object({
      scope: MemoryScopeEnum.optional().describe('Filter by memory scope'),
      type: MemoryTypeEnum.optional().describe('Filter by memory type'),
      projectId: z.string().uuid().optional().describe('Filter by project UUID'),
      agentId: z.string().uuid().optional().describe('Filter by agent UUID'),
    }),
  }, async (filters) => {
    const result = await memoryService.list(filters);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('create_memory', {
    description:
      'Store a new memory entry (decision, convention, preference, or problem). ' +
      'Use this to persist learnings, decisions, or conventions discovered during work.',
    inputSchema: z.object({
      name: z.string().min(1).max(200).describe('Memory name/title'),
      content: z.string().min(1).describe('Memory content'),
      type: MemoryTypeEnum.describe('Memory type'),
      scope: MemoryScopeEnum.optional().describe('Scope (defaults to "project")'),
      projectId: z.string().uuid().optional().describe('Associated project UUID'),
      agentId: z.string().uuid().optional().describe('Associated agent UUID'),
    }),
  }, async (args) => {
    const entry = await memoryService.create({
      ...args,
      scope: args.scope ?? MemoryScopeEnum.Enum.project,
    });
    logger.info(`[MCP] create_memory: id=${entry.id}, name="${entry.name}"`);
    return { content: [{ type: 'text' as const, text: JSON.stringify(entry, null, 2) }] };
  });

  server.registerTool('update_memory', {
    description: 'Update an existing memory entry by ID',
    inputSchema: z.object({
      id: z.string().uuid().describe('The memory UUID to update'),
      name: z.string().min(1).max(200).optional().describe('Updated name'),
      content: z.string().min(1).optional().describe('Updated content'),
      type: MemoryTypeEnum.optional().describe('Updated type'),
    }),
  }, async ({ id, ...data }) => {
    const entry = await memoryService.update(id, data);
    return { content: [{ type: 'text' as const, text: JSON.stringify(entry, null, 2) }] };
  });
}
