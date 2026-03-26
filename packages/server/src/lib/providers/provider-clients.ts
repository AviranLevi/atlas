import type { AgentProvider } from '@my-agents/shared';

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export async function createAnthropicClient(apiKey: string) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  return new Anthropic({ apiKey });
}

export async function createOpenAIClient(apiKey: string, baseUrl?: string) {
  const { default: OpenAI } = await import('openai');
  return new OpenAI({ apiKey: apiKey || 'none', baseURL: baseUrl });
}

export function ollamaBaseUrl(provider: AgentProvider): string {
  return provider.baseUrl ?? DEFAULT_OLLAMA_URL;
}
