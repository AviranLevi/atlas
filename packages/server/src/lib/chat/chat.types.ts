export type ChatEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'tool_call'; id: string; name: string; args: Record<string, unknown> }
  | { type: 'tool_call_done' }
  | { type: 'done'; stopReason: string };

export type InternalMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: { id: string; name: string; args: Record<string, unknown> }[] }
  | { role: 'tool'; toolCallId: string; content: string };

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type ToolContext = {
  projectId?: string | null;
  projectLocalPath?: string | null;
};

export interface CliChatOptions {
  executor: import('../../executors/executor.types.js').ExecutorConfig;
  prompt: string;
  cwd?: string;
  model?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface CliChatResult {
  text: string;
  exitCode: number | null;
}
