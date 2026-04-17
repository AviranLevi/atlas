// Services
import { memoryService, projectsService, settingsService } from '../index.js';

// Lib
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/chat/chat-system-prompt.ts';
const MAX_RECENT_MEMORIES = 5;

/** Assembles the API/CLI system prompt: base instructions, global settings, project scan, memories, tagged agent. */
export async function buildChatSystemPrompt(
  projectId: string | null,
  mentionedAgent?: { id: string; name: string } | null,
): Promise<string> {
  const sections: string[] = [];

  sections.push(
    'You are a helpful AI assistant integrated into a project management and AI agent orchestration platform. ' +
      'You can answer questions about the project, create tasks, agents, rules, skills, and memories using the available tools. ' +
      'Be concise and direct. When creating entities, confirm what you created.',
  );

  const globalInstructions = await settingsService.listGlobalInstructions();
  if (globalInstructions.length > 0) {
    const content = globalInstructions
      .map((gi) => gi.content)
      .filter(Boolean)
      .join('\n\n');
    if (content) sections.push(`## Global Instructions\n\n${content}`);
  }

  if (projectId) {
    try {
      const { project } = await projectsService.getContext(projectId);

      if (project.projectBrief) {
        sections.push(`## Project Context\n\n${project.projectBrief}`);
      } else {
        const projLines: string[] = [`## Project: ${project.name}`];
        if (project.description) projLines.push(project.description);
        if (project.techStack) projLines.push(`**Tech Stack:** ${project.techStack}`);
        sections.push(projLines.join('\n'));
      }

      if (project.scanData) {
        const sd = project.scanData;
        const scanLines: string[] = [];
        if (sd.languages?.length) scanLines.push(`**Languages:** ${sd.languages.join(', ')}`);
        if (sd.packageManager) scanLines.push(`**Package Manager:** ${sd.packageManager}`);
        if (sd.projectType) scanLines.push(`**Type:** ${sd.projectType}`);
        if (sd.keyDirectories && Object.keys(sd.keyDirectories).length > 0) {
          const dirs = Object.entries(sd.keyDirectories)
            .map(([k, v]) => `${k}: \`${v}\``)
            .join(', ');
          scanLines.push(`**Key Directories:** ${dirs}`);
        }
        if (scanLines.length > 0) {
          sections.push(`## Project Structure\n\n${scanLines.join('\n')}`);
        }
      }

      const allMemories = await memoryService.listByProject(projectId);
      const recentMemories = allMemories
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, MAX_RECENT_MEMORIES);
      if (recentMemories.length > 0) {
        const memList = recentMemories.map((m) => `- [${m.type}] **${m.name}**: ${m.content}`).join('\n');
        sections.push(`## Recent Project Knowledge\n\n${memList}`);
      }
    } catch (error: unknown) {
      logger.warn(`${FILE_PATH} :: buildChatSystemPrompt project context unavailable`, error);
    }
  }

  if (mentionedAgent) {
    sections.push(
      `## Tagged Agent\n\n` +
        `The user has tagged **@${mentionedAgent.name}** in this message.\n` +
        `Agent ID: \`${mentionedAgent.id}\`\n\n` +
        `When creating tasks in response to this message, use \`agentId: "${mentionedAgent.id}"\`.`,
    );
  }

  return sections.join('\n\n---\n\n');
}
