import type { AgentProvider } from '@atlas/shared';
import type { ChatEvent, InternalMessage, ToolDefinition } from './chat.types.js';
import { streamAnthropic } from './chat-stream-anthropic.js';
import { streamOpenAI } from './chat-stream-openai.js';
import { streamGoogle } from './chat-stream-google.js';
import { streamOllama } from './chat-stream-ollama.js';

export async function* streamChat(
  provider: AgentProvider,
  model: string,
  systemPrompt: string,
  messages: InternalMessage[],
  tools: ToolDefinition[],
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  switch (provider.type) {
    case 'anthropic':
      yield* streamAnthropic(provider.apiKey ?? '', model, systemPrompt, messages, tools, signal);
      break;
    case 'openai':
    case 'openai-compatible':
      yield* streamOpenAI(provider.apiKey ?? '', model, systemPrompt, messages, tools, provider.baseUrl ?? undefined, signal);
      break;
    case 'google':
      yield* streamGoogle(provider.apiKey ?? '', model, systemPrompt, messages, tools, signal);
      break;
    case 'ollama':
      yield* streamOllama(provider, model, systemPrompt, messages, tools, signal);
      break;
    default:
      throw new Error(`Unsupported provider type: ${provider.type}`);
  }
}
