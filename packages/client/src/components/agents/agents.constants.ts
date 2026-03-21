import type { ProviderType } from '@my-agents/shared';

export const NONE = '__none__';

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI',
  'openai-compatible': 'OpenAI-Compatible',
  ollama: 'Ollama (Local)',
};

export const PROVIDER_MODEL_PLACEHOLDERS: Record<ProviderType, string> = {
  anthropic: 'e.g., claude-sonnet-4-6',
  openai: 'e.g., gpt-4o',
  'openai-compatible': 'e.g., meta-llama/Llama-3-70b-instruct',
  ollama: 'e.g., llama3',
};
