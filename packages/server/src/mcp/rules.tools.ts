import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RuleTypeEnum } from '@atlas/shared';
import { rulesService } from '../services/index.js';

export function registerRuleTools(server: McpServer): void {
  server.registerTool('list_rules', {
    description: 'List coding rules and conventions, optionally filtered by type',
    inputSchema: z.object({
      type: RuleTypeEnum.optional().describe('Filter by rule type'),
    }),
  }, async (filters) => {
    const result = await rulesService.list(filters);
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
