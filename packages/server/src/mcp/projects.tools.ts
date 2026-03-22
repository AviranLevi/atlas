import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { projectsService, briefGeneratorService } from '../services/index.js';

export function registerProjectTools(server: McpServer) {
  server.registerTool('list_projects', {
    description: 'List all projects',
    inputSchema: z.object({}),
  }, async () => {
    const projects = await projectsService.list();
    return { content: [{ type: 'text' as const, text: JSON.stringify(projects, null, 2) }] };
  });

  server.registerTool('get_project', {
    description: 'Get project details by ID including name, description, and tech stack',
    inputSchema: z.object({
      id: z.string().uuid().describe('The project UUID'),
    }),
  }, async ({ id }) => {
    const project = await projectsService.getById(id);
    return { content: [{ type: 'text' as const, text: JSON.stringify(project, null, 2) }] };
  });

  server.registerTool('get_project_context', {
    description:
      'Get complete project context: project details, assigned agents, ' +
      'project tasks, and project-scoped memories. ' +
      'Use this to understand the full state of a project.',
    inputSchema: z.object({
      projectId: z.string().uuid().describe('The project UUID'),
    }),
  }, async ({ projectId }) => {
    const context = await projectsService.getContext(projectId);
    return { content: [{ type: 'text' as const, text: JSON.stringify(context, null, 2) }] };
  });

  server.registerTool('get_project_brief', {
    description:
      'Get a compact project brief: a condensed summary of the project\'s structure, ' +
      'conventions, decisions, formatting rules, scripts, and environment. ' +
      'Much lighter than get_project_context — use this for quick orientation.',
    inputSchema: z.object({
      projectId: z.string().uuid().describe('The project UUID'),
    }),
  }, async ({ projectId }) => {
    const project = await projectsService.getById(projectId);
    if (project.projectBrief) {
      return { content: [{ type: 'text' as const, text: project.projectBrief }] };
    }
    // Generate on-demand if no brief exists
    const brief = await briefGeneratorService.generateAndSave(projectId);
    return { content: [{ type: 'text' as const, text: brief }] };
  });
}
