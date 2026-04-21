// Shared
import type { AgentProvider, ProviderModel } from '@atlas/shared';

// Lib
import { createAnthropicClient, createOpenAIClient, GOOGLE_AI_BASE, ollamaBaseUrl } from './provider-clients.js';

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
  const resp = await fetch(`${GOOGLE_AI_BASE}/models/${provider.modelName}?key=${provider.apiKey ?? ''}`);
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

const OPENAI_CHAT_PREFIXES = ['gpt-', 'o1', 'o3', 'o4', 'chatgpt-'];
const DATED_SNAPSHOT_RE = /(-\d{4}(-\d{2}){0,2})$/;

function isOpenAIChatAlias(id: string): boolean {
  if (!OPENAI_CHAT_PREFIXES.some((p) => id.startsWith(p))) return false;
  if (DATED_SNAPSHOT_RE.test(id)) return false;
  if (/-(image|audio|realtime|transcription|embedding|moderation|search)/.test(id)) return false;
  return true;
}

async function listOpenAIModels(provider: AgentProvider): Promise<ProviderModel[]> {
  const client = await createOpenAIClient(provider.apiKey ?? '', provider.baseUrl ?? undefined);
  const page = await client.models.list();
  return page.data
    .filter((m) => isOpenAIChatAlias(m.id))
    .sort((a, b) => b.created - a.created)
    .map((m) => ({ value: m.id, label: m.id }));
}

async function listOpenAICompatibleModels(provider: AgentProvider): Promise<ProviderModel[]> {
  const client = await createOpenAIClient(provider.apiKey ?? '', provider.baseUrl ?? undefined);
  const page = await client.models.list();
  return page.data.map((m) => ({ value: m.id, label: m.id }));
}

const GOOGLE_DATED_RE = /-\d{3,4}$/;

async function listGoogleModels(provider: AgentProvider): Promise<ProviderModel[]> {
  const resp = await fetch(`${GOOGLE_AI_BASE}/models?key=${provider.apiKey ?? ''}`);
  if (!resp.ok) throw new Error(`Google AI returned ${resp.status}`);
  const data = (await resp.json()) as {
    models: { name: string; displayName?: string; supportedGenerationMethods?: string[] }[];
  };
  return data.models
    .filter((m) => {
      if (!m.supportedGenerationMethods?.includes('generateContent')) return false;
      const id = m.name.replace('models/', '');
      if (GOOGLE_DATED_RE.test(id)) return false;
      return true;
    })
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
  'openai-compatible': listOpenAICompatibleModels,
  google: listGoogleModels,
  ollama: listOllamaModels,
};
