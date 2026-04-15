import type { PromptContext } from './prompt-builder.types.js';

// ─── Helpers ────────────────────────────────────────────────────────

function formatSkillList(skills: Record<string, unknown>[]): string {
  return skills
    .map((s) => {
      const line = `- **${s.name}** (${s.type})`;
      return s.steps ? `${line}\n  Steps: ${s.steps}` : line;
    })
    .join('\n');
}

function formatRuleList(rules: Record<string, unknown>[]): string {
  return rules
    .map((r) => `- **${r.name}**: ${r.content ?? ''}`)
    .join('\n');
}

function formatMemoryList(
  memories: { type: string | null; scope?: string | null; name: string | null; content: string }[],
): string {
  return memories
    .map((m) => `- [${m.type ?? 'unknown'}]${m.scope === 'global' ? ' (global)' : ''} **${m.name ?? 'Untitled'}**: ${m.content}`)
    .join('\n');
}

// ─── Section builders ───────────────────────────────────────────────

export function buildMissionSection(ctx: PromptContext): string | null {
  if (!ctx.project.mission) return null;
  return `## Mission\n\n${ctx.project.mission}`;
}

export function buildPhaseSection(ctx: PromptContext): string | null {
  const { phase } = ctx;
  if (!phase) return null;

  const lines = [`## Current Goal: ${phase.name}`];
  if (phase.description) lines.push(`\n${phase.description}`);
  if (phase.successCriteria) lines.push(`\n**Success criteria:** ${phase.successCriteria}`);
  return lines.join('');
}

export function buildGlobalInstructionsSection(ctx: PromptContext): string | null {
  if (ctx.globalInstructions.length === 0) return null;

  const content = ctx.globalInstructions
    .map((gi) => gi.content)
    .filter(Boolean)
    .join('\n\n');

  return content ? `## Global Instructions\n\n${content}` : null;
}

/** Renders identity, skills, rules, and agent memories from the agent context. */
export function buildAgentIdentitySection(ctx: PromptContext): string | null {
  const { agentContext } = ctx;
  if (!agentContext) return null;

  const { agent, skills: agentSkills, rules: agentRules, projectSkills, projectRules, memories: agentMemories } =
    agentContext;

  const parts: string[] = [];

  const identityLines = [`## Your Identity: ${agent.name}`];
  if (agent.personality) identityLines.push(`\n**Personality:** ${agent.personality}`);
  if (agent.unbreakableRules) identityLines.push(`\n**Unbreakable Rules:**\n${agent.unbreakableRules}`);
  parts.push(identityLines.join('\n'));

  if (agentSkills.length > 0) {
    parts.push(`## Your Skills\n\n${formatSkillList(agentSkills)}`);
  }

  if (projectSkills.length > 0) {
    parts.push(`## Project-Specific Skills\n\n${formatSkillList(projectSkills)}`);
  }

  if (agentRules.length > 0) {
    parts.push(`## Coding Rules\n\n${formatRuleList(agentRules)}`);
  }

  if (projectRules.length > 0) {
    parts.push(`## Project-Specific Rules\n\n${formatRuleList(projectRules)}`);
  }

  if (agentMemories.length > 0) {
    const memList = agentMemories.map((m) => `- [${m.type}] ${m.content}`).join('\n');
    parts.push(`## Agent Memories\n\n${memList}`);
  }

  return parts.join('\n\n---\n\n');
}

export function buildSupermemorySection(ctx: PromptContext): string | null {
  if (ctx.supermemoryResults.length === 0) return null;
  const list = ctx.supermemoryResults.map((r) => `- ${r}`).join('\n');
  return `## Relevant Context (from Supermemory)\n\n${list}`;
}

export function buildDesignContextSection(ctx: PromptContext): string | null {
  if (!ctx.project.designContext) return null;
  return `## Design Context\n\n${ctx.project.designContext}`;
}

export function buildProjectDocsSection(ctx: PromptContext): string | null {
  if (ctx.allDocs.length === 0) return null;

  const structural = ctx.allDocs.filter((d) => d.type === 'db-schema' || d.type === 'architecture');
  const isApiTask = /api|endpoint|route|controller|http/i.test(`${ctx.task.name} ${ctx.task.notes ?? ''}`);
  const apiDocs = isApiTask ? ctx.allDocs.filter((d) => d.type === 'api-diagram') : [];
  const planDocs = ctx.allDocs
    .filter((d) => d.type === 'plan')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 1);
  const customDocs = ctx.allDocs.filter((d) => d.type === 'custom');

  const relevantDocs = [...structural, ...apiDocs, ...planDocs, ...customDocs];
  if (relevantDocs.length === 0) return null;

  const docContent = relevantDocs.map((d) => `### ${d.title}\n\n${d.content}`).join('\n\n---\n\n');
  return `## Project Documentation\n\n${docContent}`;
}

export function buildPinnedMemoriesSection(ctx: PromptContext): string | null {
  if (ctx.pinnedMemories.length === 0) return null;
  const memList = formatMemoryList(ctx.pinnedMemories);
  return `## Critical Project Facts\n\nThese are pinned facts that always apply to this project:\n\n${memList}`;
}

/**
 * Renders project context using the brief (if available) + recent memories,
 * or falls back to raw project data + full memory list (legacy path).
 */
export function buildProjectContextSection(ctx: PromptContext): string | null {
  const { project } = ctx;

  if (project.projectBrief) {
    const parts = [`## Project Context\n\n${project.projectBrief}`];

    if (ctx.recentMemories.length > 0) {
      const memList = formatMemoryList(ctx.recentMemories);
      parts.push(`## Recent Updates\n\nNewly added project knowledge (may not be in the brief yet):\n\n${memList}`);
    }

    return parts.join('\n\n---\n\n');
  }

  // Legacy fallback — no brief exists yet
  const projLines: string[] = [`## Project: ${project.name}`];
  if (project.description) projLines.push(`\n${project.description}`);
  if (project.techStack) projLines.push(`\n**Tech Stack:** ${project.techStack}`);

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

  const parts = [projLines.join('\n')];

  if (ctx.legacyUniqueMemories.length > 0) {
    const memList = formatMemoryList(ctx.legacyUniqueMemories);
    parts.push(
      `## Project Knowledge\n\nThese are established conventions, decisions, and learnings for this project:\n\n${memList}`,
    );
  }

  return parts.join('\n\n---\n\n');
}

export function buildTaskSection(ctx: PromptContext): string {
  const { task } = ctx;
  const lines: string[] = [`## Task`, `\n**Name:** ${task.name}`, `**Status:** ${task.status}`];
  if (task.priority) lines.push(`**Priority:** ${task.priority}`);
  if (task.estimate) lines.push(`**Estimate:** ${task.estimate}`);
  if (task.definitionOfDone) lines.push(`\n**Definition of Done:**\n${task.definitionOfDone}`);
  if (task.notes) lines.push(`\n**Notes:**\n${task.notes}`);
  if (task.tags && task.tags.length > 0) lines.push(`**Tags:** ${task.tags.join(', ')}`);
  return lines.join('\n');
}

export function buildVerificationSection(ctx: PromptContext): string | null {
  const { scripts } = ctx;
  if (!scripts || Object.keys(scripts).length === 0) return null;

  const pm = ctx.project.scanData?.packageManager ?? 'npm';
  const priorityKeys = ['test', 'lint', 'typecheck', 'build'];
  const lines: string[] = ['## Test & Verification Commands', ''];
  for (const key of priorityKeys) {
    if (scripts[key]) lines.push(`- **${key}**: \`${pm} run ${key}\``);
  }

  return lines.length > 2 ? lines.join('\n') : null;
}

/** Stage-aware instructions including MCP tools and memory management. */
export function buildInstructionsSection(ctx: PromptContext): string {
  const { behavior, scripts, params } = ctx;
  const stage = params.workflowStage ?? null;
  const lines: string[] = ['## Instructions', ''];

  if (stage === 'brainstorm') {
    lines.push(
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
    lines.push(
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
    lines.push('Complete the task described above. Follow the coding rules and project conventions.');
    if (behavior.enforceNoStubs) {
      lines.push(
        'Your implementation must be fully functional — no TODO comments, no placeholder values, no stub implementations.',
      );
    }
    lines.push(
      'The task description above contains all context you need. Do not reference other tasks or assume outside context.',
      'When you are finished, ensure all changes are committed to the current branch.',
    );

    if (behavior.requireVerification) {
      lines.push(
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
        lines.push('If this project has no automated tests, describe step-by-step what you manually verified.');
      }
    }
  }

  if (params.hasMcpAccess) {
    lines.push(
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

  return lines.join('\n');
}
