// Lib
import type { ChatEvent, InternalMessage, ToolDefinition } from './chat.types.js';
import { decodeText, isImage, isPdf, wrapFileContent } from './attachment-utils.js';
import { GOOGLE_AI_BASE } from '../providers/provider-clients.js';
import { logger } from '../logger.js';

/**
 * Google's Gemini API accepts a restricted subset of OpenAPI 3.0 schema — not
 * full JSON Schema 7 that `zodToJsonSchema` produces. This function recursively
 * transforms a JSON Schema object into something Gemini accepts:
 *
 *  - Removes unsupported top-level keys (`$schema`, `additionalProperties`).
 *  - Converts array `type` (e.g. `["string", "null"]`) → single `type` + `nullable`.
 *  - Converts `anyOf`/`oneOf` nullable patterns (e.g. `{ anyOf: [{type: "string"}, {type: "null"}] }`)
 *    into `{ type: "string", nullable: true }`.
 */
function toGeminiSchema(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toGeminiSchema);

  const BLOCKED_KEYS = new Set(['$schema', 'additionalProperties']);
  const src = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  // Handle anyOf/oneOf nullable pattern: { anyOf: [{type: "string"}, {type: "null"}] }
  for (const unionKey of ['anyOf', 'oneOf'] as const) {
    const union = src[unionKey];
    if (Array.isArray(union) && union.length === 2) {
      const types = union as Record<string, unknown>[];
      const nullEntry = types.find((t) => t.type === 'null');
      const realEntry = types.find((t) => t.type !== 'null');
      if (nullEntry && realEntry) {
        // Flatten: take the real schema, mark it nullable, carry over other fields
        const merged = { ...src };
        delete merged[unionKey];
        return toGeminiSchema({ ...merged, ...realEntry, nullable: true });
      }
    }
  }

  for (const [key, value] of Object.entries(src)) {
    if (BLOCKED_KEYS.has(key)) continue;

    // Convert array type → single type + nullable
    if (key === 'type' && Array.isArray(value)) {
      const types = value as string[];
      const nonNull = types.filter((t) => t !== 'null');
      if (types.includes('null')) result.nullable = true;
      result.type = nonNull.length === 1 ? nonNull[0] : (nonNull[0] ?? 'string');
      continue;
    }

    result[key] = toGeminiSchema(value);
  }

  return result;
}

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
          const part: Record<string, unknown> = { functionCall: { name: tc.name, args: tc.args } };
          // Gemini 3.5+ requires thought_signature on function call parts in multi-turn.
          if (tc.metadata?.thought_signature) {
            part.thought_signature = tc.metadata.thought_signature;
          }
          parts.push(part);
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
              parameters: toGeminiSchema(t.parameters),
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
            // Gemini 3.5+ returns thought_signature on function calls — must be preserved
            // and sent back in multi-turn conversations or the API rejects the request.
            const metadata: Record<string, unknown> = {};
            if (part.thought_signature) metadata.thought_signature = part.thought_signature;
            yield {
              type: 'tool_call',
              id: callId,
              name: fc.name,
              args: fc.args ?? {},
              ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
            };
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
