// NPM
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// Services
import { rulesService } from '../services/index.js';
// DB
import { db } from '../db/index.js';
import { rules } from '../db/schema/index.js';
// Types
import type { Rule } from '@my-agents/shared';

export function registerRuleTools(server: McpServer) {
  server.registerTool('list_rules', {
    description: 'List coding rules and conventions, optionally filtered by type (Backend, Frontend, Godot, General)',
    inputSchema: z.object({
      type: z.enum(['Backend', 'Frontend', 'Godot', 'General']).optional().describe('Filter by rule type'),
    }),
  }, async ({ type }) => {
    let result: Rule[];
    if (type) {
      const rows = db.select().from(rules).where(eq(rules.type, type)).all();
      result = rows.map((row) => ({
        ...row,
        tags: JSON.parse(row.tags ?? '[]') as string[],
      })) as Rule[];
    } else {
      result = await rulesService.list();
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('get_rule', {
    description: 'Get full rule content by ID, including tags and the rule body',
    inputSchema: z.object({
      id: z.string().uuid().describe('The rule UUID'),
    }),
  }, async ({ id }) => {
    const rule = await rulesService.getById(id);
    return { content: [{ type: 'text' as const, text: JSON.stringify(rule, null, 2) }] };
  });
}
