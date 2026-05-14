// External
import { z } from 'zod';

// Shared
import type { CreateSkill } from '@atlas/shared';
import { SkillTypeEnum } from '@atlas/shared';

// Services
import { skillsService } from '../../../services/index.js';

// Lib
import { makeChatTool } from './registry.js';

export const createSkillTool = makeChatTool({
  name: 'create_skill',
  description: 'Create a new skill (a reusable workflow or capability for agents).',
  mutating: true,
  inputSchema: z.object({
    name: z.string().min(1),
    type: SkillTypeEnum,
    steps: z.string().optional().describe('Step-by-step instructions'),
  }),
  handler: (input) =>
    skillsService.create({
      name: input.name,
      type: input.type,
      steps: input.steps ?? null,
      inputFormat: null,
      outputFormat: null,
    } as CreateSkill),
});

export const listSkillsTool = makeChatTool({
  name: 'list_skills',
  description: 'List all available skills.',
  mutating: false,
  inputSchema: z.object({}),
  handler: (_, context) => skillsService.list({ projectId: context.projectId ?? undefined }),
});

export const skillTools = [createSkillTool, listSkillsTool];
