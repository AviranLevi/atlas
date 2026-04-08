// Lib
import type { ChatEvent, InternalMessage, ToolDefinition } from './chat.types.js';
import { decodeText, isImage, isPdf, wrapFileContent } from './attachment-utils.js';
import { createAnthropicClient } from '../providers/provider-clients.js';
import { logger } from '../logger.js';

export async function* streamAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: InternalMessage[],
  tools: ToolDefinition[],
  signal?: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const client = await createAnthropicClient(apiKey);

  const anthropicMessages: unknown[] = [];
  for (const m of messages) {
    if (m.role === 'user') {
      // Build content blocks — start with the text, then append any attachments
      const blocks: unknown[] = [];
      if (m.content) blocks.push({ type: 'text', text: m.content });

      for (const att of m.attachments ?? []) {
        if (isImage(att)) {
          blocks.push({
            type: 'image',
            source: { type: 'base64', media_type: att.mimeType, data: att.data },
          });
        } else if (isPdf(att)) {
          // Anthropic supports native PDF document blocks
          blocks.push({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: att.data },
          });
        } else {
          // Plain-text files: inject as a labelled text block
          blocks.push({ type: 'text', text: wrapFileContent(att.name, decodeText(att)) });
        }
      }

      // Anthropic accepts a bare string when there is only a single text block
      const content =
        blocks.length === 1 && (blocks[0] as Record<string, unknown>).type === 'text'
          ? (blocks[0] as { text: string }).text
          : blocks;

      anthropicMessages.push({ role: 'user', content });
    } else if (m.role === 'tool') {
      anthropicMessages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: m.toolCallId, content: m.content }],
      });
    } else {
      const blocks: unknown[] = [];
      if (m.content) blocks.push({ type: 'text', text: m.content });
      if (m.toolCalls) {
        for (const tc of m.toolCalls) {
          blocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args });
        }
      }
      // Anthropic rejects messages with empty content arrays — skip them
      if (blocks.length > 0) {
        anthropicMessages.push({ role: 'assistant', content: blocks });
      }
    }
  }

  const anthropicTools = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Record<string, unknown>,
  }));

  const stream = client.messages.stream(
    {
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: anthropicMessages as Parameters<typeof client.messages.stream>[0]['messages'],
      tools: anthropicTools as Parameters<typeof client.messages.stream>[0]['tools'],
    },
    { signal },
  );

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
        try {
          args = JSON.parse(toolArgsJson || '{}');
        } catch (e: unknown) {
          logger.debug('chat-stream :: anthropic tool args parse failed', e);
        }
        yield { type: 'tool_call', id: currentToolId, name: currentToolName, args };
        yield { type: 'tool_call_done' };
        currentToolName = '';
        currentToolId = '';
        toolArgsJson = '';
      }
    } else if (event.type === 'message_stop') {
      const msg = await stream.finalMessage();
      if (msg.usage) {
        yield {
          type: 'usage',
          inputTokens: msg.usage.input_tokens,
          outputTokens: msg.usage.output_tokens,
        };
      }
      yield { type: 'done', stopReason: msg.stop_reason ?? 'end_turn' };
    }
  }
}
