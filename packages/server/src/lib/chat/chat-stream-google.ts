// Lib
import type { ChatEvent, InternalMessage, ToolDefinition } from './chat.types.js';
import { decodeText, isImage, isPdf, wrapFileContent } from './attachment-utils.js';
import { GOOGLE_AI_BASE } from '../providers/provider-clients.js';
import { logger } from '../logger.js';

export async function* streamGoogle(
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
      const parts: unknown[] = [];
      if (m.content) parts.push({ text: m.content });

      for (const att of m.attachments ?? []) {
        if (isImage(att) || isPdf(att)) {
          // Gemini 1.5+ supports inline images and PDFs via inline_data
          parts.push({ inline_data: { mime_type: att.mimeType, data: att.data } });
        } else {
          parts.push({ text: wrapFileContent(att.name, decodeText(att)) });
        }
      }

      // Google rejects messages with empty parts arrays — skip them
      if (parts.length === 0) continue;
      geminiContents.push({ role: 'user', parts });
    } else if (m.role === 'tool') {
      geminiContents.push({
        role: 'user',
        parts: [
          { functionResponse: { name: '_tool_result', response: { toolCallId: m.toolCallId, result: m.content } } },
        ],
      });
    } else {
      const parts: unknown[] = [];
      if (m.content) parts.push({ text: m.content });
      if (m.toolCalls) {
        for (const tc of m.toolCalls) {
          parts.push({ functionCall: { name: tc.name, args: tc.args } });
        }
      }
      // Google rejects messages with empty parts arrays — skip them
      if (parts.length === 0) continue;
      geminiContents.push({ role: 'model', parts });
    }
  }

  const geminiTools =
    tools.length > 0
      ? [
          {
            functionDeclarations: tools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            })),
          },
        ]
      : undefined;

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
      try {
        data = JSON.parse(json);
      } catch (e: unknown) {
        logger.debug('chat-stream :: google chunk parse failed', e);
        continue;
      }

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
