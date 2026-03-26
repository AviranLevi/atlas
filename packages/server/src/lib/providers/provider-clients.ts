import type { AgentProvider } from '@atlas/shared';
import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const GOOGLE_AI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export async function createAnthropicClient(apiKey: string): Promise<Anthropic> {
  const { default: AnthropicSDK } = await import('@anthropic-ai/sdk');
  return new AnthropicSDK({ apiKey });
}

export async function createOpenAIClient(apiKey: string, baseUrl?: string): Promise<OpenAI> {
  const { default: OpenAISDK } = await import('openai');
  return new OpenAISDK({ apiKey: apiKey || 'none', baseURL: baseUrl });
}

export function ollamaBaseUrl(provider: AgentProvider): string {
  return provider.baseUrl ?? DEFAULT_OLLAMA_URL;
}
