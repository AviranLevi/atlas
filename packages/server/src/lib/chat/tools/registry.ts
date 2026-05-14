// External
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { z } from 'zod';

// Lib
import type { ToolContext, ToolDefinition } from '../chat.types.js';

/** Erased (runtime) shape — all tool arrays are typed as this. */
export interface ChatTool {
  name: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  /** True if this tool creates or mutates persistent state — stripped in plan-only mode. */
  mutating: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (input: any, context: ToolContext) => Promise<unknown> | unknown;
}

/** Strongly-typed shape used only for authoring individual tools. */
interface TypedChatTool<TInput extends z.ZodTypeAny> extends Omit<ChatTool, 'handler'> {
  inputSchema: TInput;
  handler: (input: z.infer<TInput>, context: ToolContext) => Promise<unknown> | unknown;
}

/** Accepts a strongly-typed tool definition and returns it as the erased ChatTool — enabling typed handler args during authoring without breaking array assignments. */
export function makeChatTool<TInput extends z.ZodTypeAny>(t: TypedChatTool<TInput>): ChatTool {
  return t as ChatTool;
}

/** Converts a ChatTool into the JSON Schema-based ToolDefinition the LLM streaming layer consumes. */
export function toToolDefinition(tool: ChatTool): ToolDefinition {
  return {
    name: tool.name,
    description: tool.description,
    parameters: zodToJsonSchema(tool.inputSchema, { target: 'jsonSchema7' }) as Record<string, unknown>,
  };
}
