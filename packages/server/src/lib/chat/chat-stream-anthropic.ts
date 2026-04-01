// Lib
import type { ChatEvent, InternalMessage, ToolDefinition } from './chat.types.js';
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
