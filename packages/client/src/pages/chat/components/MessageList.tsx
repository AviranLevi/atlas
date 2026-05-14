// React / library
import { useRef, useEffect } from 'react';

// Components
import { AgentThinking } from './AgentThinking';
import { ChatUICard } from './ChatUICard';
import { MessageBubble } from './MessageBubble';
import { StreamingBubble } from './StreamingBubble';

// Lib
import { parseAgentContent } from '../chat.utils';

// Types
import type { ChatMessage } from '@atlas/shared';
import type { StreamingToolCall, ThinkingStep, UIResourceItem } from '../chat.types';

interface MessageListProps {
  messages: ChatMessage[];
  streamingText: string;
  streamingToolCalls: StreamingToolCall[];
  streamingUIResources?: UIResourceItem[];
  isStreaming: boolean;
  pendingUserMessage?: string | null;
  onPrompt?: (text: string) => void;
  onExecute?: (text: string) => void;
}

type MessageGroup =
  | { kind: 'message'; message: ChatMessage }
  | { kind: 'tools'; steps: ThinkingStep[]; key: string; cards: UIResourceItem[] };

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
 * and attaches any persisted UI cards from the corresponding tool-result messages.
 */
function groupMessages(messages: ChatMessage[]): MessageGroup[] {
  const result: MessageGroup[] = [];
  let pendingSteps: ThinkingStep[] = [];
  let pendingCards: UIResourceItem[] = [];
  let pendingKey = '';

  for (const msg of messages) {
    // Collect UI cards from tool-result messages into the current pending group.
    if (msg.role === 'tool') {
      if (msg.toolResults) {
        for (const tr of msg.toolResults) {
          const res = tr.result as Record<string, unknown> | undefined;
          if (res && typeof res.__uiHtml === 'string') {
            pendingCards.push({
              toolCallId: tr.toolCallId,
              toolName: (res.__uiToolName as string) ?? 'unknown',
              html: res.__uiHtml,
            });
          }
        }
      }
      continue;
    }

    if (isToolOnly(msg)) {
      if (!pendingKey) pendingKey = msg.id;
      pendingSteps.push(...extractSteps(msg));
    } else {
      if (pendingSteps.length > 0) {
        result.push({ kind: 'tools', steps: pendingSteps, key: pendingKey, cards: pendingCards });
        pendingSteps = [];
        pendingCards = [];
        pendingKey = '';
      }
      result.push({ kind: 'message', message: msg });
    }
  }

  if (pendingSteps.length > 0) {
    result.push({ kind: 'tools', steps: pendingSteps, key: pendingKey, cards: pendingCards });
  }

  return result;
}

export function MessageList({
  messages,
  streamingText,
  streamingToolCalls,
  streamingUIResources,
  isStreaming,
  pendingUserMessage,
  onPrompt,
  onExecute,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const lastMessageIsFromUser = messages.length > 0 && messages[messages.length - 1]?.role === 'user';
  const showPendingMessage = pendingUserMessage && !lastMessageIsFromUser;

  const groups = groupMessages(messages);

  // IDs of cards currently shown in StreamingBubble — skip them in persisted groups to avoid flash.
  const streamingCardIds =
    isStreaming && streamingUIResources ? new Set(streamingUIResources.map((r) => r.toolCallId)) : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl py-4">
        {groups.map((group) => {
          const cards =
            group.kind === 'tools'
              ? streamingCardIds
                ? group.cards.filter((c) => !streamingCardIds.has(c.toolCallId))
                : group.cards
              : [];

          return (
            <div key={group.kind === 'tools' ? group.key : group.message.id}>
              {group.kind === 'tools' ? (
                <div className="px-4 py-1">
                  <AgentThinking steps={group.steps} isStreaming={false} />
                  {cards.length > 0 && (
                    <div className="flex gap-3 py-2">
                      <div className="w-8 shrink-0" />
                      <div className="flex max-w-[80%] flex-col gap-2 w-full">
                        {cards.map((r) => (
                          <ChatUICard key={r.toolCallId} resource={r} onPrompt={onPrompt} onExecute={onExecute} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <MessageBubble message={group.message} />
              )}
            </div>
          );
        })}
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

        {isStreaming && (
          <StreamingBubble
            text={streamingText}
            toolCalls={streamingToolCalls}
            uiResources={streamingUIResources}
            onPrompt={onPrompt}
            onExecute={onExecute}
          />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
