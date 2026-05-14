// External
import { z } from 'zod';

// Shared
import type { CreateRule } from '@atlas/shared';
import { DEFAULT_RULE_TYPES } from '@atlas/shared';

// Services
import { rulesService } from '../../../services/index.js';

// Lib
import { makeChatTool } from './registry.js';

export const createRuleTool = makeChatTool({
  name: 'create_rule',
  description: 'Create a coding rule that agents must follow.',
  mutating: true,
  inputSchema: z.object({
    name: z.string().min(1),
    type: z.enum(DEFAULT_RULE_TYPES).optional().default('General').describe('Rule category'),
    content: z.string().describe('The rule content/instructions'),
    tags: z.array(z.string()).optional().describe('Optional labels'),
  }),
  handler: (input) =>
    rulesService.create({
      name: input.name,
      type: input.type ?? 'General',
      content: input.content,
      tags: input.tags ?? [],
    } as CreateRule),
});

export const listRulesTool = makeChatTool({
  name: 'list_rules',
  description: 'List all coding rules.',
  mutating: false,
  inputSchema: z.object({}),
  handler: (_, context) => rulesService.list({ projectId: context.projectId ?? undefined }),
});

export const ruleTools = [createRuleTool, listRulesTool];
