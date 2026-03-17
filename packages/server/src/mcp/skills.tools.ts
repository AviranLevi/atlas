// NPM
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// Services
import { skillsService } from '../services/index.js';
// DB
import { db } from '../db/index.js';
import { skills } from '../db/schema/index.js';
// Types
import type { Skill } from '@my-agents/shared';

export function registerSkillTools(server: McpServer) {
  server.registerTool('list_skills', {
    description: 'List available skills, optionally filtered by type',
    inputSchema: z.object({
      type: z
        .enum([
          'Planning',
          'Coding',
          'Review',
          'Architecture / Data',
          'Planning / Roadmapping',
          'Design / Systems',
          'Design',
          'Design / Balancing',
        ])
        .optional()
        .describe('Filter by skill type'),
    }),
  }, async ({ type }) => {
    let result: Skill[];
    if (type) {
      result = db.select().from(skills).where(eq(skills.type, type)).all() as Skill[];
    } else {
      result = await skillsService.list();
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool('get_skill', {
    description: 'Get full skill details by ID including steps, input format, and output format',
    inputSchema: z.object({
      id: z.string().uuid().describe('The skill UUID'),
    }),
  }, async ({ id }) => {
    const skill = await skillsService.getById(id);
    return { content: [{ type: 'text' as const, text: JSON.stringify(skill, null, 2) }] };
  });
}
