// External
import { z } from 'zod';

// Shared
import { DocTypeEnum } from '@atlas/shared';

// Repositories
import { projectDocsRepository } from '../../../db/repositories/index.js';

// Services
import { orchestratorService, projectsService } from '../../../services/index.js';

// Lib
import { makeChatTool } from './registry.js';

export const getProjectContextTool = makeChatTool({
  name: 'get_project_context',
  description: 'Get the full project context including brief, tech stack, and current state.',
  mutating: false,
  inputSchema: z.object({}),
  handler: (_, context) => {
    if (!context.projectId) return { error: 'No project selected' };
    return projectsService.getContext(context.projectId);
  },
});

export const getProjectDocsTool = makeChatTool({
  name: 'get_project_docs',
  description: 'Get all documentation for the current project — API diagrams, DB schema, plans, and custom docs.',
  mutating: false,
  inputSchema: z.object({
    type: DocTypeEnum.optional().describe('Filter by doc type. Omit to get all docs.'),
  }),
  handler: (input, context) => {
    if (!context.projectId) return { error: 'No project selected' };
    const docs = projectDocsRepository.findByProjectId(context.projectId);
    return input.type ? docs.filter((d) => d.type === input.type) : docs;
  },
});

export const listWorkspacesTool = makeChatTool({
  name: 'list_workspaces',
  description: 'List agent workspaces (running, completed, or failed agent work sessions).',
  mutating: false,
  inputSchema: z.object({}),
  handler: () => orchestratorService.listAll(),
});

export const projectTools = [getProjectContextTool, getProjectDocsTool, listWorkspacesTool];
