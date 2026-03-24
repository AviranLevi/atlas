import type { AgentProvider, ProviderModel } from '@my-agents/shared';
import { createAnthropicClient, createOpenAIClient, ollamaBaseUrl, GOOGLE_AI_BASE } from './provider-clients.js';

// ---------------------------------------------------------------------------
// Per-provider: test connection
// ---------------------------------------------------------------------------

async function testAnthropic(provider: AgentProvider): Promise<void> {
  const client = await createAnthropicClient(provider.apiKey ?? '');
  await client.messages.create({
    model: provider.modelName,
    max_tokens: 1,
    messages: [{ role: 'user', content: 'ping' }],
  });
}

async function testOpenAI(provider: AgentProvider): Promise<void> {
  const client = await createOpenAIClient(provider.apiKey ?? '', provider.baseUrl ?? undefined);
  await client.chat.completions.create({
    model: provider.modelName,
    max_tokens: 1,
    messages: [{ role: 'user', content: 'ping' }],
  });
}

async function testGoogle(provider: AgentProvider): Promise<void> {
  const resp = await fetch(
    `${GOOGLE_AI_BASE}/models/${provider.modelName}?key=${provider.apiKey ?? ''}`,
  );
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Google AI returned ${resp.status}: ${body.slice(0, 200)}`);
  }
}

async function testOllama(provider: AgentProvider): Promise<void> {
  const resp = await fetch(`${ollamaBaseUrl(provider)}/api/version`);
  if (!resp.ok) throw new Error(`Ollama returned ${resp.status}`);
}

// ---------------------------------------------------------------------------
// Per-provider: list models
// ---------------------------------------------------------------------------

async function listAnthropicModels(provider: AgentProvider): Promise<ProviderModel[]> {
  const client = await createAnthropicClient(provider.apiKey ?? '');
  const page = await client.models.list({ limit: 100 });
  return page.data.map((m) => ({ value: m.id, label: m.display_name ?? m.id }));
}

async function listOpenAIModels(provider: AgentProvider): Promise<ProviderModel[]> {
  const client = await createOpenAIClient(provider.apiKey ?? '', provider.baseUrl ?? undefined);
  const page = await client.models.list();
  return page.data.map((m) => ({ value: m.id, label: m.id }));
}

async function listGoogleModels(provider: AgentProvider): Promise<ProviderModel[]> {
  const resp = await fetch(`${GOOGLE_AI_BASE}/models?key=${provider.apiKey ?? ''}`);
  if (!resp.ok) throw new Error(`Google AI returned ${resp.status}`);
  const data = (await resp.json()) as {
    models: { name: string; displayName?: string; supportedGenerationMethods?: string[] }[];
  };
  return data.models
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => ({
      value: m.name.replace('models/', ''),
      label: m.displayName ?? m.name.replace('models/', ''),
    }));
}

async function listOllamaModels(provider: AgentProvider): Promise<ProviderModel[]> {
  const resp = await fetch(`${ollamaBaseUrl(provider)}/api/tags`);
  if (!resp.ok) throw new Error(`Ollama returned ${resp.status}`);
  const data = (await resp.json()) as { models: { name: string }[] };
  return data.models.map((m) => ({ value: m.name, label: m.name }));
}

// ---------------------------------------------------------------------------
// Dispatch tables
// ---------------------------------------------------------------------------

export const TEST_FNS: Record<string, (p: AgentProvider) => Promise<void>> = {
  anthropic: testAnthropic,
  openai: testOpenAI,
  'openai-compatible': testOpenAI,
  google: testGoogle,
  ollama: testOllama,
};

export const LIST_MODEL_FNS: Record<string, (p: AgentProvider) => Promise<ProviderModel[]>> = {
  anthropic: listAnthropicModels,
  openai: listOpenAIModels,
  'openai-compatible': listOpenAIModels,
  google: listGoogleModels,
  ollama: listOllamaModels,
};
