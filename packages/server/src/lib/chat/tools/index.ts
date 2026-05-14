// Shared
import type { ExecutionMode } from '@atlas/shared';

// Lib
import type { ToolContext, ToolDefinition } from '../chat.types.js';
import { logger } from '../../logger.js';
import type { ChatTool } from './registry.js';
import { toToolDefinition } from './registry.js';
import { taskTools } from './tasks.tools.js';
import { agentTools } from './agents.tools.js';
import { ruleTools } from './rules.tools.js';
import { skillTools } from './skills.tools.js';
import { memoryTools } from './memory.tools.js';
import { searchTools } from './search.tools.js';
import { projectTools } from './project.tools.js';
import { filesystemTools } from './filesystem.tools.js';
import { pipelineTools } from './pipelines.tools.js';
import { uiTools } from './ui.tools.js';

const FILE_PATH = 'lib/chat/tools/index.ts';

const ALL_CHAT_TOOLS: ChatTool[] = [
  ...taskTools,
  ...agentTools,
  ...ruleTools,
  ...skillTools,
  ...memoryTools,
  ...searchTools,
  ...projectTools,
  ...filesystemTools,
  ...pipelineTools,
  ...uiTools,
];

const TOOL_BY_NAME = new Map(ALL_CHAT_TOOLS.map((t) => [t.name, t]));

export const CHAT_TOOLS: ToolDefinition[] = ALL_CHAT_TOOLS.map(toToolDefinition);

const PLAN_ONLY_TOOLS: ToolDefinition[] = ALL_CHAT_TOOLS.filter((t) => !t.mutating).map(toToolDefinition);

/** Returns the tool list filtered for the given execution mode. */
export function getToolsForMode(mode: ExecutionMode): ToolDefinition[] {
  return mode === 'plan-only' ? PLAN_ONLY_TOOLS : CHAT_TOOLS;
}

/** Validates args with the tool's Zod schema and runs the handler. */
export async function executeTool(name: string, args: Record<string, unknown>, context: ToolContext): Promise<unknown> {
  const tool = TOOL_BY_NAME.get(name);
  if (!tool) return { error: `Unknown tool: ${name}` };

  const parsed = tool.inputSchema.safeParse(args);
  if (!parsed.success) {
    const issues = parsed.error.errors.map((e) => `${e.path.join('.') || '<root>'}: ${e.message}`).join('; ');
    return { error: `Invalid arguments for ${name}: ${issues}` };
  }

  try {
    return await tool.handler(parsed.data, context);
  } catch (error: unknown) {
    logger.error(`${FILE_PATH} :: executeTool(${name})`, error);
    return { error: error instanceof Error ? error.message : 'Tool execution failed' };
  }
}
