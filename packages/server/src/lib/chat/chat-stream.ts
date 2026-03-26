import type { AgentProvider } from '@atlas/shared';
import { createAnthropicClient, createOpenAIClient, ollamaBaseUrl, GOOGLE_AI_BASE } from '../providers/provider-clients.js';
import type { ChatEvent, InternalMessage, ToolDefinition } from './chat.types.js';

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
      yield* streamOllama(ollamaBaseUrl(provider), model, systemPrompt, messages, tools, signal);
      break;
    default:
      throw new Error(`Unsupported provider type: ${provider.type}`);
  }
}

// ---------------------------------------------------------------------------
// Anthropic
// ---------------------------------------------------------------------------

async function* streamAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: InternalMessage[],
  tools: ToolDefinition[],
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const client = await createAnthropicClient(apiKey);

  const anthropicMessages = messages.map((m) => {
    if (m.role === 'user') return { role: 'user' as const, content: m.content };
    if (m.role === 'tool') {
      return {
        role: 'user' as const,
        content: [{ type: 'tool_result' as const, tool_use_id: m.toolCallId, content: m.content }],
      };
    }
    const blocks: unknown[] = [];
    if (m.content) blocks.push({ type: 'text', content: m.content });
    if (m.toolCalls) {
      for (const tc of m.toolCalls) {
        blocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args });
      }
    }
    return { role: 'assistant' as const, content: blocks };
  });

  const anthropicTools = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Record<string, unknown>,
  }));

  const stream = client.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: anthropicMessages as Parameters<typeof client.messages.stream>[0]['messages'],
    tools: anthropicTools as Parameters<typeof client.messages.stream>[0]['tools'],
  }, { signal });

  let currentToolId = '';
  let currentToolName = '';
  let toolArgsJson = '';

  for await (const event of stream) {
    if (signal?.aborted) return;

    if (event.type === 'content_block_delta') {
      const delta = event.delta as unknown as Record<string, unknown>;
      if (delta.type === 'text_delta') {
        yield { type: 'text_delta', text: delta.text as string };
      } else if (delta.type === 'input_json_delta') {
        toolArgsJson += delta.partial_json as string;
      }
    } else if (event.type === 'content_block_start') {
      const block = event.content_block as unknown as Record<string, unknown>;
      if (block.type === 'tool_use') {
        currentToolId = block.id as string;
        currentToolName = block.name as string;
        toolArgsJson = '';
      }
    } else if (event.type === 'content_block_stop') {
      if (currentToolName) {
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(toolArgsJson || '{}'); } catch { /* empty */ }
        yield { type: 'tool_call', id: currentToolId, name: currentToolName, args };
        yield { type: 'tool_call_done' };
        currentToolName = '';
        currentToolId = '';
        toolArgsJson = '';
      }
    } else if (event.type === 'message_stop') {
      const msg = await stream.finalMessage();
      yield { type: 'done', stopReason: msg.stop_reason ?? 'end_turn' };
    }
  }
}

// ---------------------------------------------------------------------------
// OpenAI (and OpenAI-compatible)
// ---------------------------------------------------------------------------

async function* streamOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: InternalMessage[],
  tools: ToolDefinition[],
  baseUrl?: string,
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const client = await createOpenAIClient(apiKey, baseUrl);

  const openaiMessages: unknown[] = [{ role: 'system', content: systemPrompt }];
  for (const m of messages) {
    if (m.role === 'user') {
      openaiMessages.push({ role: 'user', content: m.content });
    } else if (m.role === 'tool') {
      openaiMessages.push({ role: 'tool', tool_call_id: m.toolCallId, content: m.content });
    } else {
      const msg: Record<string, unknown> = { role: 'assistant', content: m.content || null };
      if (m.toolCalls?.length) {
        msg.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.args) },
        }));
      }
      openaiMessages.push(msg);
    }
  }

  const openaiTools = tools.map((t) => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));

  const stream = await client.chat.completions.create({
    model,
    messages: openaiMessages as Parameters<typeof client.chat.completions.create>[0]['messages'],
    tools: openaiTools,
    stream: true,
  }, { signal });

  const toolCalls = new Map<number, { id: string; name: string; argsJson: string }>();

  for await (const chunk of stream) {
    if (signal?.aborted) return;

    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;

    if (delta.content) {
      yield { type: 'text_delta', text: delta.content };
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index;
        if (!toolCalls.has(idx)) {
          toolCalls.set(idx, { id: tc.id ?? '', name: tc.function?.name ?? '', argsJson: '' });
        }
        const entry = toolCalls.get(idx)!;
        if (tc.id) entry.id = tc.id;
        if (tc.function?.name) entry.name = tc.function.name;
        if (tc.function?.arguments) entry.argsJson += tc.function.arguments;
      }
    }

    if (chunk.choices[0]?.finish_reason) {
      for (const [, tc] of toolCalls) {
        let args: Record<string, unknown> = {};
        try { args = JSON.parse(tc.argsJson || '{}'); } catch { /* empty */ }
        yield { type: 'tool_call', id: tc.id, name: tc.name, args };
        yield { type: 'tool_call_done' };
      }
      yield { type: 'done', stopReason: chunk.choices[0].finish_reason };
    }
  }
}

// ---------------------------------------------------------------------------
// Google AI (Gemini) via REST streaming
// ---------------------------------------------------------------------------

async function* streamGoogle(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: InternalMessage[],
  tools: ToolDefinition[],
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const geminiContents: unknown[] = [];
  for (const m of messages) {
    if (m.role === 'user') {
      geminiContents.push({ role: 'user', parts: [{ text: m.content }] });
    } else if (m.role === 'tool') {
      geminiContents.push({
        role: 'user',
        parts: [{ functionResponse: { name: '_tool_result', response: { toolCallId: m.toolCallId, result: m.content } } }],
      });
    } else {
      const parts: unknown[] = [];
      if (m.content) parts.push({ text: m.content });
      if (m.toolCalls) {
        for (const tc of m.toolCalls) {
          parts.push({ functionCall: { name: tc.name, args: tc.args } });
        }
      }
      geminiContents.push({ role: 'model', parts });
    }
  }

  const geminiTools = tools.length > 0 ? [{
    functionDeclarations: tools.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    })),
  }] : undefined;

  const url = `${GOOGLE_AI_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: geminiContents,
      tools: geminiTools,
      generationConfig: { maxOutputTokens: 4096 },
    }),
    signal,
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Google AI returned ${resp.status}: ${body.slice(0, 300)}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error('No response body from Google AI');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    if (signal?.aborted) return;
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;

      let data: Record<string, unknown>;
      try { data = JSON.parse(json); } catch { continue; }

      const candidates = data.candidates as { content?: { parts?: unknown[] }; finishReason?: string }[] | undefined;
      if (!candidates?.[0]) continue;

      const parts = candidates[0].content?.parts as Record<string, unknown>[] | undefined;
      if (parts) {
        for (const part of parts) {
          if (part.text) {
            yield { type: 'text_delta', text: part.text as string };
          }
          if (part.functionCall) {
            const fc = part.functionCall as { name: string; args?: Record<string, unknown> };
            const callId = `google_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            yield { type: 'tool_call', id: callId, name: fc.name, args: fc.args ?? {} };
            yield { type: 'tool_call_done' };
          }
        }
      }

      if (candidates[0].finishReason) {
        yield { type: 'done', stopReason: candidates[0].finishReason };
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Ollama (OpenAI-compatible API)
// ---------------------------------------------------------------------------

async function* streamOllama(
  baseUrl: string,
  model: string,
  systemPrompt: string,
  messages: InternalMessage[],
  tools: ToolDefinition[],
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  yield* streamOpenAI('none', model, systemPrompt, messages, tools, `${baseUrl}/v1`, signal);
}
