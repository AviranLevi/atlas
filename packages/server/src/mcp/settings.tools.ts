import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { settingsService } from '../services/index.js';

export function registerSettingsTools(server: McpServer) {
  server.registerTool('get_global_instructions', {
    description:
      'Get the global instructions that apply to all agents. ' +
      'These should be loaded at the start of every agent session.',
    inputSchema: z.object({}),
  }, async () => {
    const instructions = await settingsService.listGlobalInstructions();
    const content = instructions.map((i) => i.content).filter(Boolean).join('\n\n');
    return { content: [{ type: 'text' as const, text: content || '(No global instructions configured)' }] };
  });

  server.registerTool('list_dispatch_rules', {
    description: 'List all dispatch rules that map patterns to agents and skills',
    inputSchema: z.object({}),
  }, async () => {
    const rules = await settingsService.listDispatchRules();
    return { content: [{ type: 'text' as const, text: JSON.stringify(rules, null, 2) }] };
  });
}
