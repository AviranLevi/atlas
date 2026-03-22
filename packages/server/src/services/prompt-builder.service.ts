// Services
import { agentsService, projectsService, tasksService, settingsService, memoryService } from './index.js';
// Utils
import { logger } from '../lib/logger.js';
import { AppError } from '../lib/errors.js';

const FILE_PATH = 'services/prompt-builder.service.ts';

interface PromptBuildParams {
  taskId: string;
  projectId: string;
  agentId?: string | null;
  hasMcpAccess?: boolean;
}

export class PromptBuilderService {
  /**
   * Builds a structured markdown prompt that gives the agent full context
   * about the task, project, and its own identity/instructions.
   */
  async build(params: PromptBuildParams): Promise<string> {
    const FUNCTION_NAME = 'build';
    try {
      const task = await tasksService.getById(params.taskId);
      const projectContext = await projectsService.getContext(params.projectId);

      const sections: string[] = [];

      const globalInstructions = await settingsService.listGlobalInstructions();
      if (globalInstructions.length > 0) {
        const content = globalInstructions.map((gi) => gi.content).filter(Boolean).join('\n\n');
        if (content) {
          sections.push(`## Global Instructions\n\n${content}`);
        }
      }

      if (params.agentId) {
        const agentContext = await agentsService.getContext(params.agentId);
        const { agent, skills: agentSkills, rules: agentRules, memories: agentMemories } = agentContext;

        const agentLines: string[] = [`## Your Identity: ${agent.name}`];
        if (agent.personality) agentLines.push(`\n**Personality:** ${agent.personality}`);
        if (agent.unbreakableRules) agentLines.push(`\n**Unbreakable Rules:**\n${agent.unbreakableRules}`);
        sections.push(agentLines.join('\n'));

        if (agentSkills.length > 0) {
          const skillList = agentSkills
            .map((s) => {
              const skill = s as Record<string, unknown>;
              const line = `- **${skill.name}** (${skill.type})`;
              return skill.steps ? `${line}\n  Steps: ${skill.steps}` : line;
            })
            .join('\n');
          sections.push(`## Your Skills\n\n${skillList}`);
        }

        if (agentRules.length > 0) {
          const ruleList = agentRules
            .map((r) => `- **${(r as Record<string, unknown>).name}**: ${(r as Record<string, unknown>).content ?? ''}`)
            .join('\n');
          sections.push(`## Coding Rules\n\n${ruleList}`);
        }

        // Agent-specific memories (deprecated in favor of project memories below,
        // but still included for backwards compatibility)
        if (agentMemories.length > 0) {
          const memList = agentMemories
            .map((m) => `- [${m.type}] ${m.content}`)
            .join('\n');
          sections.push(`## Agent Memories\n\n${memList}`);
        }
      }

      // ─── Project memories (global + project-scoped) ───────────────
      const projectMemories = await memoryService.listByProject(params.projectId);
      // Deduplicate with agent memories (which are fetched separately above)
      const agentMemoryIds = new Set<string>();
      if (params.agentId) {
        const agentContext = await agentsService.getContext(params.agentId);
        for (const m of agentContext.memories) {
          agentMemoryIds.add(m.id);
        }
      }
      const uniqueProjectMemories = projectMemories.filter((m) => !agentMemoryIds.has(m.id));

      if (uniqueProjectMemories.length > 0) {
        const memList = uniqueProjectMemories
          .map((m) => `- [${m.type}]${m.scope === 'global' ? ' (global)' : ''} **${m.name}**: ${m.content}`)
          .join('\n');
        sections.push(`## Project Knowledge\n\nThese are established conventions, decisions, and learnings for this project:\n\n${memList}`);
      }

      const { project } = projectContext;
      const projLines: string[] = [`## Project: ${project.name}`];
      if (project.description) projLines.push(`\n${project.description}`);
      if (project.techStack) projLines.push(`\n**Tech Stack:** ${project.techStack}`);
      sections.push(projLines.join('\n'));

      const taskLines: string[] = [
        `## Task`,
        `\n**Name:** ${task.name}`,
        `**Status:** ${task.status}`,
      ];
      if (task.priority) taskLines.push(`**Priority:** ${task.priority}`);
      if (task.estimate) taskLines.push(`**Estimate:** ${task.estimate}`);
      if (task.definitionOfDone) taskLines.push(`\n**Definition of Done:**\n${task.definitionOfDone}`);
      if (task.notes) taskLines.push(`\n**Notes:**\n${task.notes}`);
      if (task.tags && task.tags.length > 0) taskLines.push(`**Tags:** ${task.tags.join(', ')}`);
      sections.push(taskLines.join('\n'));

      const instructionLines = [
        '## Instructions',
        '',
        'Complete the task described above. Follow the coding rules and project conventions.',
        'When you are finished, ensure all changes are committed to the current branch.',
      ];

      if (params.hasMcpAccess) {
        instructionLines.push(
          '',
          '## MCP Tools Available',
          '',
          'You have access to the "my-agents" MCP server with the following tools:',
          '- `update_task` -- Update this task\'s status (e.g., to "In Review" or "Done"), add notes',
          '- `create_task` -- Create new tasks on the Kanban board if you discover sub-tasks or bugs',
          '- `create_memory` -- Save important decisions, conventions, or problems discovered',
          '- `update_memory` -- Update an existing memory entry',
          '- `list_memories` -- List existing memories for reference',
          '- `list_tasks` -- List other tasks for context',
          '- `get_project_context` -- Get full project context',
          '- `search` -- Search across agents, skills, rules, memory, tasks, projects',
          '',
          `**Task ID:** ${params.taskId}`,
          `**Project ID:** ${params.projectId}`,
          '',
          `When done, update this task (ID: ${params.taskId}) status to "In Review".`,
          'If you find additional work needed, create new tasks for it.',
          '',
          '## Memory Management (Important)',
          '',
          'As you work, **proactively save memories** using `create_memory` for anything future agents should know:',
          '',
          '- **Convention**: Coding patterns, naming conventions, or project structure patterns you discover',
          '  - Example: "Components use .component.tsx suffix", "All API calls go through the api.ts utility"',
          '- **Decision**: Architecture or design decisions you make or discover',
          '  - Example: "Using Drizzle ORM with SQLite", "State management via React Query, not Redux"',
          '- **Problem**: Bugs, gotchas, or tricky issues you encounter and solve',
          '  - Example: "SQLite WAL mode required for concurrent reads", "Must run git worktree prune before creating new worktrees"',
          '- **Preference**: User/project preferences you notice',
          '  - Example: "Prefer named exports over default exports", "Use cn() utility for conditional classNames"',
          '',
          `Always set \`projectId\` to "${params.projectId}" and \`scope\` to "project" when creating memories.`,
          'Before creating a memory, check existing memories with `list_memories` to avoid duplicates.',
          'Do NOT save trivial or task-specific information — only save knowledge that would help future tasks.',
        );
      }

      sections.push(instructionLines.join('\n'));

      return sections.join('\n\n---\n\n');
    } catch (error: unknown) {
      logger.error(`${FILE_PATH} :: ${FUNCTION_NAME}`, error);
      throw new AppError('Failed to build prompt', { cause: error });
    }
  }
}
