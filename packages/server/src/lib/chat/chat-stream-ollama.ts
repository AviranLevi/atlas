// Shared
import type { AgentProvider } from '@atlas/shared';

// Lib
import type { ChatEvent, InternalMessage, ToolDefinition } from './chat.types.js';
import { ollamaBaseUrl } from '../providers/provider-clients.js';
import { streamOpenAI } from './chat-stream-openai.js';

export async function* streamOllama(
  provider: AgentProvider,
  model: string,
  systemPrompt: string,
  messages: InternalMessage[],
  tools: ToolDefinition[],
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  yield* streamOpenAI('none', model, systemPrompt, messages, tools, `${ollamaBaseUrl(provider)}/v1`, signal);
}
