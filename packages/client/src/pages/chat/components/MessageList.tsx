// React / library
import { useRef, useEffect } from 'react';

// Components
import { AgentThinking } from './AgentThinking';
import { MessageBubble } from './MessageBubble';
import { StreamingBubble } from './StreamingBubble';

// Lib
import { parseAgentContent } from '../chat.utils';

// Types
import type { ChatMessage } from '@atlas/shared';
import type { StreamingToolCall, ThinkingStep } from '../chat.types';

interface MessageListProps {
  messages: ChatMessage[];
  streamingText: string;
  streamingToolCalls: StreamingToolCall[];
  isStreaming: boolean;
  pendingUserMessage?: string | null;
}

type MessageGroup = { kind: 'message'; message: ChatMessage } | { kind: 'tools'; steps: ThinkingStep[]; key: string };

/** Returns true if an assistant message has tool steps but no readable response text. */
function isToolOnly(msg: ChatMessage): boolean {
  if (msg.role !== 'assistant') return false;
  if (msg.toolCalls && msg.toolCalls.length > 0 && !msg.content?.trim()) return true;
  const { steps, response } = parseAgentContent(msg.content);
  return steps.length > 0 && !response?.trim();
}

function extractSteps(msg: ChatMessage): ThinkingStep[] {
  if (msg.toolCalls && msg.toolCalls.length > 0) {
    return msg.toolCalls.map((tc) => ({ id: tc.id, toolName: tc.name, hint: '' }));
  }
  return parseAgentContent(msg.content).steps;
}

/**
 * Groups consecutive tool-only assistant messages into a single AgentThinking block
 * so they don't render as separate bubbles in the message list.
 */
function groupMessages(messages: ChatMessage[]): MessageGroup[] {
  const filtered = messages.filter((m) => m.role !== 'tool');
  const result: MessageGroup[] = [];
  let pendingSteps: ThinkingStep[] = [];
  let pendingKey = '';

  for (const msg of filtered) {
    if (isToolOnly(msg)) {
      if (!pendingKey) pendingKey = msg.id;
      pendingSteps.push(...extractSteps(msg));
    } else {
      if (pendingSteps.length > 0) {
        result.push({ kind: 'tools', steps: pendingSteps, key: pendingKey });
        pendingSteps = [];
        pendingKey = '';
      }
      result.push({ kind: 'message', message: msg });
    }
  }

  if (pendingSteps.length > 0) {
    result.push({ kind: 'tools', steps: pendingSteps, key: pendingKey });
  }

  return result;
}

export function MessageList({
  messages,
  streamingText,
  streamingToolCalls,
  isStreaming,
  pendingUserMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const lastMessageIsFromUser = messages.length > 0 && messages[messages.length - 1]?.role === 'user';
  const showPendingMessage = pendingUserMessage && !lastMessageIsFromUser;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl py-4">
        {groupMessages(messages).map((group) =>
          group.kind === 'tools' ? (
            <div key={group.key} className="px-4 py-1">
              <AgentThinking steps={group.steps} isStreaming={false} />
            </div>
          ) : (
            <MessageBubble key={group.message.id} message={group.message} />
          ),
        )}
        {showPendingMessage && (
          <MessageBubble
            message={{
              id: '__pending__',
              conversationId: '',
              role: 'user',
              content: pendingUserMessage,
              toolCalls: null,
              toolResults: null,
              attachments: null,
              createdAt: new Date().toISOString(),
            }}
          />
        )}
        {isStreaming && <StreamingBubble text={streamingText} toolCalls={streamingToolCalls} />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
