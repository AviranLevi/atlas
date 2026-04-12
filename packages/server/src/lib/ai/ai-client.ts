// External
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

// Shared
import type { AgentProvider } from '@atlas/shared';

/** Builds a Vercel AI SDK LanguageModel from an AgentProvider record. */
export function buildAiModel(provider: AgentProvider, model?: string | null): LanguageModel {
  const resolvedModel = model ?? provider.modelName ?? 'default';

  switch (provider.type) {
    case 'anthropic':
      return createAnthropic({ apiKey: provider.apiKey ?? undefined })(resolvedModel);
    case 'openai':
      return createOpenAI({ apiKey: provider.apiKey ?? undefined })(resolvedModel);
    case 'google':
      return createGoogleGenerativeAI({ apiKey: provider.apiKey ?? undefined })(resolvedModel);
    case 'openai-compatible':
      return createOpenAI({ apiKey: provider.apiKey ?? undefined, baseURL: provider.baseUrl ?? undefined })(
        resolvedModel,
      );
    case 'ollama':
      return createOpenAI({ apiKey: 'ollama', baseURL: provider.baseUrl ?? 'http://localhost:11434/v1' })(
        resolvedModel,
      );
    default:
      throw new Error(`Unsupported provider type: ${(provider as { type: string }).type}`);
  }
}
