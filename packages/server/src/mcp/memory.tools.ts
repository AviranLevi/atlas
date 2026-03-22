// NPM
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// Services
import { memoryService } from '../services/index.js';
// DB
import { db } from '../db/index.js';
import { memory } from '../db/schema/index.js';
// Types
import type { Memory } from '@my-agents/shared';

export function registerMemoryTools(server: McpServer) {
  server.registerTool('list_memories', {
    description: 'List memory entries with optional filters by scope, type, projectId, or agentId',
    inputSchema: z.object({
      scope: z.enum(['global', 'project']).optional().describe('Filter by memory scope'),
      type: z.enum(['Decision', 'Convention', 'Preference', 'Problem']).optional().describe('Filter by memory type'),
      projectId: z.string().uuid().optional().describe('Filter by project UUID'),
      agentId: z.string().uuid().optional().describe('Filter by agent UUID'),
    }),
  }, async ({ scope, type, projectId, agentId }) => {
    try {
      const conditions = [];
      if (scope) conditions.push(eq(memory.scope, scope));
      if (type) conditions.push(eq(memory.type, type));
      if (projectId) conditions.push(eq(memory.projectId, projectId));
      if (agentId) conditions.push(eq(memory.agentId, agentId));

      let result: Memory[];
      if (conditions.length > 0) {
        result = db
          .select()
          .from(memory)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .all() as Memory[];
      } else {
        result = await memoryService.list();
      }

      console.error(`[MCP] list_memories returned ${result.length} entries`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[MCP] list_memories FAILED: ${msg}`);
      return { content: [{ type: 'text' as const, text: `Error listing memories: ${msg}` }], isError: true };
    }
  });

  server.registerTool('create_memory', {
    description:
      'Store a new memory entry (decision, convention, preference, or problem). ' +
      'Use this to persist learnings, decisions, or conventions discovered during work.',
    inputSchema: z.object({
      name: z.string().min(1).max(200).describe('Memory name/title'),
      content: z.string().min(1).describe('Memory content'),
      type: z.enum(['Decision', 'Convention', 'Preference', 'Problem']).describe('Memory type'),
      scope: z.enum(['global', 'project']).optional().describe('Scope (defaults to "project")'),
      projectId: z.string().uuid().optional().describe('Associated project UUID'),
      agentId: z.string().uuid().optional().describe('Associated agent UUID'),
    }),
  }, async (args) => {
    try {
      console.error(`[MCP] create_memory called: name="${args.name}", type=${args.type}, scope=${args.scope ?? 'project'}, projectId=${args.projectId ?? 'none'}`);
      const entry = await memoryService.create(args);
      console.error(`[MCP] create_memory SUCCESS: id=${entry.id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(entry, null, 2) }] };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[MCP] create_memory FAILED: ${msg}`);
      return { content: [{ type: 'text' as const, text: `Error creating memory: ${msg}` }], isError: true };
    }
  });

  server.registerTool('update_memory', {
    description: 'Update an existing memory entry by ID',
    inputSchema: z.object({
      id: z.string().uuid().describe('The memory UUID to update'),
      name: z.string().min(1).max(200).optional().describe('Updated name'),
      content: z.string().min(1).optional().describe('Updated content'),
      type: z.enum(['Decision', 'Convention', 'Preference', 'Problem']).optional().describe('Updated type'),
    }),
  }, async ({ id, ...data }) => {
    try {
      console.error(`[MCP] update_memory called: id=${id}`);
      const entry = await memoryService.update(id, data);
      console.error(`[MCP] update_memory SUCCESS: id=${entry.id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(entry, null, 2) }] };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[MCP] update_memory FAILED: ${msg}`);
      return { content: [{ type: 'text' as const, text: `Error updating memory: ${msg}` }], isError: true };
    }
  });
}
