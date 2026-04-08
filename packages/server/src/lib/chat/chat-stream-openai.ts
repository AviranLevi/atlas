// External
import type { ChatCompletionCreateParamsStreaming } from 'openai/resources/chat/completions';

// Lib
import type { ChatEvent, InternalMessage, ToolDefinition } from './chat.types.js';
import { decodeText, extractPdfText, isImage, isPdf, wrapFileContent } from './attachment-utils.js';
import { createOpenAIClient } from '../providers/provider-clients.js';
import { logger } from '../logger.js';

export async function* streamOpenAI(
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
      if (!m.attachments?.length) {
        openaiMessages.push({ role: 'user', content: m.content });
      } else {
        // Build a multi-part content array when attachments are present
        const parts: unknown[] = [];
        if (m.content) parts.push({ type: 'text', text: m.content });

        for (const att of m.attachments) {
          if (isImage(att)) {
            parts.push({
              type: 'image_url',
              image_url: { url: `data:${att.mimeType};base64,${att.data}` },
            });
          } else if (isPdf(att)) {
            // OpenAI has no native PDF block — extract text server-side
            const text = await extractPdfText(att);
            parts.push({ type: 'text', text: wrapFileContent(att.name, text) });
          } else {
            parts.push({ type: 'text', text: wrapFileContent(att.name, decodeText(att)) });
          }
        }

        openaiMessages.push({ role: 'user', content: parts });
      }
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

  const createParams: Record<string, unknown> = {
    model,
    messages: openaiMessages,
    tools: openaiTools,
    stream: true,
  };
  if (!baseUrl) createParams.stream_options = { include_usage: true };

  const stream = await client.chat.completions.create(createParams as unknown as ChatCompletionCreateParamsStreaming, {
    signal,
  });

  const toolCalls = new Map<number, { id: string; name: string; argsJson: string }>();

  for await (const chunk of stream) {
    if (signal?.aborted) return;

    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      yield { type: 'text_delta', text: delta.content };
    }

    if (delta?.tool_calls) {
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
        try {
          args = JSON.parse(tc.argsJson || '{}');
        } catch (e: unknown) {
          logger.debug('chat-stream :: openai tool args parse failed', e);
        }
        yield { type: 'tool_call', id: tc.id, name: tc.name, args };
        yield { type: 'tool_call_done' };
      }
      yield { type: 'done', stopReason: chunk.choices[0].finish_reason };
    }

    if (chunk.usage) {
      const u = chunk.usage as { prompt_tokens?: number; completion_tokens?: number };
      yield {
        type: 'usage',
        inputTokens: u.prompt_tokens ?? 0,
        outputTokens: u.completion_tokens ?? 0,
      };
    }
  }
}
