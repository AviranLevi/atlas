// Types
import type { ProviderModel, ProviderType } from '@atlas/shared';

export const NONE = '__none__';
export const CUSTOM_MODEL = '__custom__';

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI',
  google: 'Google AI (Gemini)',
  'openai-compatible': 'OpenAI-Compatible',
  ollama: 'Ollama (Local)',
};

export const PROVIDER_MODEL_PLACEHOLDERS: Record<ProviderType, string> = {
  anthropic: 'e.g., claude-sonnet-4-6',
  openai: 'e.g., gpt-4o',
  google: 'e.g., gemini-2.5-pro',
  'openai-compatible': 'e.g., meta-llama/Llama-3-70b-instruct',
  ollama: 'e.g., llama3',
};

export const PROVIDER_MODEL_PRESETS: Record<ProviderType, ProviderModel[]> = {
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { value: 'claude-haiku-4-20250514', label: 'Claude Haiku 4' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'o3', label: 'o3' },
    { value: 'o4-mini', label: 'o4 Mini' },
  ],
  google: [
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ],
  'openai-compatible': [],
  ollama: [],
};
