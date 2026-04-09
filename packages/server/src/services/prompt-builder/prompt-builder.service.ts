// Shared
import type { Memory } from '@atlas/shared';

// Services
import {
  agentsService,
  memoryService,
  phasesService,
  projectsService,
  settingsService,
  supermemoryService,
  tasksService,
} from '../index.js';

// Lib
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

const FILE_PATH = 'services/prompt-builder/prompt-builder.service.ts';

/**
 * Max number of individual memories to include in the prompt.
 * The project brief already contains the top 15 condensed memories,
 * so we only include the most recent ones that might not be in the brief yet.
 */
const MAX_RECENT_MEMORIES = 5;

interface PromptBuildParams {
  taskId: string;
  projectId: string;
  agentId?: string | null;
  hasMcpAccess?: boolean;
  /** Workflow stage — changes the agent's instructions for this workspace */
  workflowStage?: 'brainstorm' | 'plan' | 'execute' | null;
}

export class PromptBuilderService {
  /**
   * Builds a structured markdown prompt that gives the agent full context
   * about the task, project, and its own identity/instructions.
   *
   * Context strategy:
   * - Project brief (compact, ~300-600 tokens) — always included
   * - Recent memories not yet in brief — up to MAX_RECENT_MEMORIES
   * - Full memory list available via MCP `list_memories` tool (lazy loading)
   */
  async build(params: PromptBuildParams): Promise<string> {
    const FUNCTION_NAME = 'build';
    try {
      const task = await tasksService.getById(params.taskId);
      const projectContext = await projectsService.getContext(params.projectId);
      const { project } = projectContext;

      const sections: string[] = [];

      if (project.mission) {
        sections.push(`## Mission\n\n${project.mission}`);
      }

      if (task.phaseId) {
        try {
          const phase = await phasesService.getById(task.phaseId);
          const goalLines = [`## Current Goal: ${phase.name}`];
          if (phase.description) goalLines.push(`\n${phase.description}`);
          if (phase.successCriteria) goalLines.push(`\n**Success criteria:** ${phase.successCriteria}`);
          sections.push(goalLines.join(''));
        } catch (error: unknown) {
          logger.warn('prompt-builder.service :: phase lookup failed', error);
        }
      }

      const globalInstructions = await settingsService.listGlobalInstructions();
      if (globalInstructions.length > 0) {
        const content = globalInstructions
          .map((gi) => gi.content)
          .filter(Boolean)
          .join('\n\n');
        if (content) {
          sections.push(`## Global Instructions\n\n${content}`);
        }
      }

      if (params.agentId) {
        const agentContext = await agentsService.getContext(params.agentId, params.projectId);
        const {
          agent,
          skills: agentSkills,
          rules: agentRules,
          projectSkills,
          projectRules,
          memories: agentMemories,
        } = agentContext;

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

        if (projectSkills.length > 0) {
          const skillList = projectSkills
            .map((s) => {
              const skill = s as Record<string, unknown>;
              const line = `- **${skill.name}** (${skill.type})`;
              return skill.steps ? `${line}\n  Steps: ${skill.steps}` : line;
            })
            .join('\n');
          sections.push(`## Project-Specific Skills\n\n${skillList}`);
        }

        if (agentRules.length > 0) {
          const ruleList = agentRules
            .map((r) => `- **${(r as Record<string, unknown>).name}**: ${(r as Record<string, unknown>).content ?? ''}`)
            .join('\n');
          sections.push(`## Coding Rules\n\n${ruleList}`);
        }

        if (projectRules.length > 0) {
          const ruleList = projectRules
            .map((r) => `- **${(r as Record<string, unknown>).name}**: ${(r as Record<string, unknown>).content ?? ''}`)
            .join('\n');
          sections.push(`## Project-Specific Rules\n\n${ruleList}`);
        }

        // Agent-specific memories (deprecated in favor of project memories below,
        // but still included for backwards compatibility)
        if (agentMemories.length > 0) {
          const memList = agentMemories.map((m) => `- [${m.type}] ${m.content}`).join('\n');
          sections.push(`## Agent Memories\n\n${memList}`);
        }
      }

      // ─── Supermemory: semantically relevant context ─────────────
      const supermemoryResults = await supermemoryService.searchRelevant(
        task.name + (task.notes ? ` ${task.notes}` : ''),
        params.projectId,
      );
      if (supermemoryResults.length > 0) {
        const smList = supermemoryResults.map((r) => `- ${r}`).join('\n');
        sections.push(`## Relevant Context (from Supermemory)\n\n${smList}`);
      }

      // ─── Design context (human-authored design system for UI tasks) ────
      if (project.designContext) {
        sections.push(`## Design Context\n\n${project.designContext}`);
      }

      // ─── Pinned memories (always-load tier, L0) ─────────────────
      // These load unconditionally regardless of brief or recency.
      const allProjectMemories = await memoryService.listByProject(params.projectId);
      const pinnedMemories = allProjectMemories.filter((m) => m.isPinned);
      if (pinnedMemories.length > 0) {
        const memList = pinnedMemories
          .map((m) => `- [${m.type}]${m.scope === 'global' ? ' (global)' : ''} **${m.name}**: ${m.content}`)
          .join('\n');
        sections.push(
          `## Critical Project Facts\n\nThese are pinned facts that always apply to this project:\n\n${memList}`,
        );
      }
      const pinnedIds = new Set(pinnedMemories.map((m) => m.id));

      // ─── Project context (brief-based or fallback) ─────────────

      if (project.projectBrief) {
        // Use the pre-generated compact brief
        sections.push(`## Project Context\n\n${project.projectBrief}`);

        // Include only recent memories that may not be in the brief yet
        const recentMemories = await this.getRecentMemories(
          params.projectId,
          params.agentId,
          pinnedIds,
          allProjectMemories,
        );
        if (recentMemories.length > 0) {
          const memList = recentMemories
            .map((m) => `- [${m.type}]${m.scope === 'global' ? ' (global)' : ''} **${m.name}**: ${m.content}`)
            .join('\n');
          sections.push(
            `## Recent Updates\n\nNewly added project knowledge (may not be in the brief yet):\n\n${memList}`,
          );
        }
      } else {
        // Fallback: no brief exists yet — use raw data (legacy behavior)
        const projLines: string[] = [`## Project: ${project.name}`];
        if (project.description) projLines.push(`\n${project.description}`);
        if (project.techStack) projLines.push(`\n**Tech Stack:** ${project.techStack}`);

        // Include scan data inline if no brief
        if (project.scanData) {
          const sd = project.scanData;
          if (sd.projectType) projLines.push(`**Type:** ${sd.projectType}`);
          if (sd.languages?.length) projLines.push(`**Languages:** ${sd.languages.join(', ')}`);
          if (sd.packageManager) projLines.push(`**Package Manager:** ${sd.packageManager}`);
          if (sd.keyDirectories && Object.keys(sd.keyDirectories).length > 0) {
            const dirs = Object.entries(sd.keyDirectories)
              .map(([k, v]) => `${k}: \`${v}\``)
              .join(', ');
            projLines.push(`**Key Directories:** ${dirs}`);
          }
          if (sd.formatting) {
            const tools: string[] = [];
            if (sd.formatting.prettier) tools.push('Prettier');
            if (sd.formatting.eslint) tools.push('ESLint');
            if (sd.formatting.biome) tools.push('Biome');
            if (sd.formatting.editorconfig) tools.push('EditorConfig');
            if (tools.length > 0) projLines.push(`**Formatting:** ${tools.join(', ')}`);
          }
        }
        sections.push(projLines.join('\n'));

        // Include ALL memories (legacy, unbounded) — skip pinned (already above)
        const projectMemories = allProjectMemories;
        const agentMemoryIds = new Set<string>();
        if (params.agentId) {
          const agentContext = await agentsService.getContext(params.agentId);
          for (const m of agentContext.memories) {
            agentMemoryIds.add(m.id as string);
          }
        }
        const uniqueProjectMemories = projectMemories.filter((m) => !agentMemoryIds.has(m.id) && !pinnedIds.has(m.id));

        if (uniqueProjectMemories.length > 0) {
          const memList = uniqueProjectMemories
            .map((m) => `- [${m.type}]${m.scope === 'global' ? ' (global)' : ''} **${m.name}**: ${m.content}`)
            .join('\n');
          sections.push(
            `## Project Knowledge\n\nThese are established conventions, decisions, and learnings for this project:\n\n${memList}`,
          );
        }
      }

      const taskLines: string[] = [`## Task`, `\n**Name:** ${task.name}`, `**Status:** ${task.status}`];
      if (task.priority) taskLines.push(`**Priority:** ${task.priority}`);
      if (task.estimate) taskLines.push(`**Estimate:** ${task.estimate}`);
      if (task.definitionOfDone) taskLines.push(`\n**Definition of Done:**\n${task.definitionOfDone}`);
      if (task.notes) taskLines.push(`\n**Notes:**\n${task.notes}`);
      if (task.tags && task.tags.length > 0) taskLines.push(`**Tags:** ${task.tags.join(', ')}`);
      sections.push(taskLines.join('\n'));

      // ─── Test & Verification Commands ────────────────────────────
      const scripts = project.scanData?.scripts;
      if (scripts && Object.keys(scripts).length > 0) {
        const pm = project.scanData?.packageManager ?? 'npm';
        const priorityKeys = ['test', 'lint', 'typecheck', 'build'];
        const scriptLines: string[] = ['## Test & Verification Commands', ''];
        for (const key of priorityKeys) {
          if (scripts[key]) scriptLines.push(`- **${key}**: \`${pm} run ${key}\``);
        }
        if (scriptLines.length > 2) sections.push(scriptLines.join('\n'));
      }

      // ─── Agent behavior settings (project defaults) ─────────────
      const behavior = project.agentBehavior ?? {
        requireVerification: true,
        enforceNoStubs: true,
        workflowMode: 'off' as const,
        autoAiReview: false,
      };

      // ─── Instructions (stage-aware) ──────────────────────────────
      const stage = params.workflowStage ?? null;
      const instructionLines: string[] = ['## Instructions', ''];

      if (stage === 'brainstorm') {
        instructionLines.push(
          'Your job for this workspace is to BRAINSTORM ONLY — do not write any implementation code.',
          '',
          'Output the following sections:',
          '1. **Problem Analysis** — restate the problem in your own words and identify any ambiguities',
          '2. **Approaches** — propose 2–3 distinct implementation approaches, each with tradeoffs',
          '3. **Recommendation** — which approach you recommend and why',
          '',
          'Do NOT create files, make commits, or implement anything.',
          'Your output will be reviewed by a human before the next stage begins.',
        );
      } else if (stage === 'plan') {
        instructionLines.push(
          'Your job for this workspace is to CREATE A DETAILED IMPLEMENTATION PLAN — do not write any implementation code.',
          '',
          'Your plan must include for every step:',
          '- The exact file(s) to create or modify (full paths)',
          '- What the change is and why',
          '- Any new function signatures or data structures',
          '- The test(s) to write first (RED phase)',
          '',
          'Assume the person executing the plan has zero context beyond what you write.',
          'Do NOT implement. Do NOT commit anything.',
          'Your plan will be reviewed by a human before execution begins.',
        );
      } else {
        // Default execute stage (or no workflow)
        instructionLines.push('Complete the task described above. Follow the coding rules and project conventions.');
        if (behavior.enforceNoStubs) {
          instructionLines.push(
            'Your implementation must be fully functional — no TODO comments, no placeholder values, no stub implementations.',
          );
        }
        instructionLines.push(
          'The task description above contains all context you need. Do not reference other tasks or assume outside context.',
          'When you are finished, ensure all changes are committed to the current branch.',
        );

        if (behavior.requireVerification) {
          instructionLines.push(
            '',
            '## Verification Requirement',
            '',
            'Before marking this task as complete, you MUST:',
            '',
            '1. Run the relevant test command (see Test & Verification Commands above, or check package.json/Makefile)',
            '2. Run the linter or typechecker if available',
            '3. Include the full terminal output of these commands in your completion message',
            '',
            'If any tests fail or the linter reports errors, fix them before completing.',
            'Do NOT claim the task is done without running and showing proof. "It should work" is not evidence.',
          );
          if (!scripts) {
            instructionLines.push(
              'If this project has no automated tests, describe step-by-step what you manually verified.',
            );
          }
        }
      }

      if (params.hasMcpAccess) {
        instructionLines.push(
          '',
          '## MCP Tools Available',
          '',
          'You have access to the "atlas" MCP server with the following tools:',
          '- `update_task` -- Update this task\'s status (e.g., to "In Review" or "Done"), add notes',
          '- `create_task` -- Create new tasks on the Kanban board if you discover sub-tasks or bugs',
          '- `create_memory` -- Save important decisions, conventions, or problems discovered (pass supersedesId to replace an outdated memory)',
          '- `update_memory` -- Update an existing memory entry (set status to "archived" to retire it)',
          '- `supersede_memory` -- Replace a stale memory with updated information in one operation',
          '- `list_memories` -- List existing memories for reference (full detail)',
          '- `list_tasks` -- List other tasks for context',
          '- `get_project_context` -- Get full project context (all tasks, agents, memories)',
          '- `get_project_brief` -- Get the compact project brief',
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

  /**
   * Get the most recent memories that were created/updated AFTER the brief
   * was last generated. These supplement the brief with fresh knowledge.
   * Pinned memories are excluded since they're already injected in the L0 tier.
   * Pass pre-fetched memories to avoid a redundant DB call.
   */
  private async getRecentMemories(
    projectId: string,
    agentId?: string | null,
    pinnedIds?: Set<string>,
    prefetched?: Memory[],
  ) {
    const allMemories = prefetched ?? (await memoryService.listByProject(projectId));

    // Exclude agent-specific memories and already-injected pinned memories
    const agentMemoryIds = new Set<string>();
    if (agentId) {
      const agentContext = await agentsService.getContext(agentId);
      for (const m of agentContext.memories) {
        agentMemoryIds.add(m.id as string);
      }
    }

    const filtered = allMemories.filter((m) => !agentMemoryIds.has(m.id) && !pinnedIds?.has(m.id));

    // Sort by most recently updated and take only the latest N
    return filtered
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, MAX_RECENT_MEMORIES);
  }
}
