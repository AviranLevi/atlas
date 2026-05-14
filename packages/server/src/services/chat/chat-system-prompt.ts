// Shared
import type { ExecutionMode } from '@atlas/shared';

// Services
import { agentsService, memoryService, projectsService, settingsService } from '../index.js';

// Lib
import { logger } from '../../lib/logger.js';
import { formatRuleList, formatSkillList } from '../prompt-builder/prompt-sections.js';

const FILE_PATH = 'services/chat/chat-system-prompt.ts';
const MAX_RECENT_MEMORIES = 5;

function getExecutionModePrompt(mode: ExecutionMode): string | null {
  if (mode === 'confirm') {
    return (
      '## Execution Mode: Confirm\n\n' +
      'Before executing any action that creates or modifies data (creating tasks, agents, rules, skills, or memories), you MUST:\n' +
      '1. First describe what you plan to do in a clear, numbered list\n' +
      '2. Ask the user for explicit confirmation before proceeding\n' +
      '3. Only execute the actions after the user approves\n\n' +
      'For read-only operations (listing, searching, browsing files), proceed without confirmation.\n' +
      'If the user says "yes", "go ahead", "do it", or similar affirmative, proceed with the planned actions.'
    );
  }
  if (mode === 'plan-only') {
    return (
      '## Execution Mode: Plan Only\n\n' +
      'You are in plan-only mode. You must NEVER execute actions directly. Instead:\n' +
      "1. Analyze the user's request thoroughly\n" +
      '2. Create a detailed action plan describing exactly what would need to be done\n' +
      '3. Structure the plan as a numbered list of concrete steps\n' +
      '4. Include specific details (task names, descriptions, assignments, etc.)\n' +
      '5. Present the plan to the user for review\n\n' +
      'You do NOT have access to tools that create or modify data. You can only read and search existing data to inform your plans.\n' +
      'When presenting plans, use clear markdown formatting with headers and bullet points.'
    );
  }
  return null; // auto — no extra instructions
}

/** Assembles the API/CLI system prompt: base instructions, global settings, project scan, memories, tagged agent. */
export async function buildChatSystemPrompt(
  projectId: string | null,
  mentionedAgent?: { id: string; name: string } | null,
  executionMode?: ExecutionMode,
): Promise<string> {
  const sections: string[] = [];

  sections.push(
    'You are a helpful AI assistant integrated into a project management and AI agent orchestration platform. ' +
      'You can answer questions about the project, create tasks, agents, rules, skills, and memories using the available tools. ' +
      'Be concise and direct. When creating entities, confirm what you created.\n\n' +
      '## Rich UI Tools\n\n' +
      'You have two special tools that render interactive visual cards directly in the chat:\n\n' +
      '- **`present_plan`** — Call this whenever you have a multi-step plan to show the user. ' +
      'Use it instead of writing a numbered list in text. Call it BEFORE executing the steps.\n' +
      '- **`confirm_action`** — Call this when you need the user to choose between options before you proceed ' +
      "(e.g. when in 'confirm' execution mode, or when a decision requires user input). " +
      "Provide 2–4 choices; each button click sends that choice as the user's next message.\n\n" +
      'Prefer these tools over plain text whenever the content benefits from structure or interaction.\n\n' +
      'IMPORTANT: After calling `present_plan` or `confirm_action`, do NOT repeat the same content as text. ' +
      'The card already displays it visually. Instead, write a brief follow-up sentence ' +
      '(e.g. "Here\'s the plan — let me know if you\'d like changes." or "Which option works for you?"). ' +
      'Never duplicate card content in your text response.\n\n' +
      'When a message starts with [EXECUTE], it means the user clicked an action button on a card. ' +
      'Execute the requested action immediately — call the appropriate tool(s) directly. ' +
      'NEVER call `present_plan` in response to an [EXECUTE] message — the user already saw the plan. ' +
      'Use `confirm_action` if in confirm mode, then proceed with execution.\n\n' +
      'IMPORTANT: Once you are in an [EXECUTE] flow (the user clicked a card button), stay in execution mode ' +
      'even if the user sends follow-up messages answering your questions (e.g. picking an agent, confirming details). ' +
      'Do NOT re-present the plan or call `present_plan` again — just proceed with executing the original action. ' +
      'The user already approved the plan; subsequent messages are answers to your clarifying questions, not new requests.\n\n' +
      'When creating tasks from a plan, call `create_task` for each step. ' +
      'When creating a pipeline, use `create_pipeline` — it creates tasks AND assembles them into a sequential pipeline in one call.\n\n' +
      '## Agent Assignment\n\n' +
      'When creating tasks or pipelines, always try to assign an agent. ' +
      "If the user hasn't specified which agent(s) to use, call `list_agents` to see what's available, " +
      'then use `confirm_action` to let the user pick an agent before executing. ' +
      'When listing agents as choices, always set `icon: "agent"` on each agent choice and `icon: "cancel"` on the cancel option ' +
      'so the user can visually distinguish agent names from action buttons. ' +
      'Once the user picks an agent (via button click or text), execute immediately — do NOT show another confirmation or plan. ' +
      'For pipelines, use the `defaultAgentId` parameter to assign one agent to all tasks. ' +
      'Tasks without an agent cannot be started in a pipeline — the user will be blocked.',
  );

  if (executionMode) {
    const modePrompt = getExecutionModePrompt(executionMode);
    if (modePrompt) sections.push(modePrompt);
  }

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
    try {
      const agentCtx = await agentsService.getContext(mentionedAgent.id, projectId ?? undefined);
      const { agent, skills, rules, projectSkills, projectRules, memories } = agentCtx;

      const parts: string[] = [];

      const identityLines = [`## Your Identity: ${agent.name}`];
      if (agent.personality) identityLines.push(`\n**Personality:** ${agent.personality}`);
      if (agent.unbreakableRules) identityLines.push(`\n**Unbreakable Rules:**\n${agent.unbreakableRules}`);
      identityLines.push(`\nWhen creating tasks in response to this conversation, use \`agentId: "${agent.id}"\`.`);
      parts.push(identityLines.join(''));

      if (skills.length > 0) parts.push(`## Your Skills\n\n${formatSkillList(skills)}`);
      if (projectSkills.length > 0) parts.push(`## Project-Specific Skills\n\n${formatSkillList(projectSkills)}`);
      if (rules.length > 0) parts.push(`## Coding Rules\n\n${formatRuleList(rules)}`);
      if (projectRules.length > 0) parts.push(`## Project-Specific Rules\n\n${formatRuleList(projectRules)}`);
      if (memories.length > 0) {
        const memList = (memories as { type: string; content: string }[])
          .map((m) => `- [${m.type}] ${m.content}`)
          .join('\n');
        parts.push(`## Agent Memories\n\n${memList}`);
      }

      sections.push(parts.join('\n\n---\n\n'));
    } catch (error: unknown) {
      logger.warn(`${FILE_PATH} :: buildChatSystemPrompt agent context unavailable`, error);
      // Fallback: at minimum identify the tagged agent
      sections.push(
        `## Tagged Agent\n\n` +
          `The user has tagged **@${mentionedAgent.name}**.\n` +
          `Agent ID: \`${mentionedAgent.id}\`\n\n` +
          `When creating tasks in response to this message, use \`agentId: "${mentionedAgent.id}"\`.`,
      );
    }
  }

  return sections.join('\n\n---\n\n');
}
