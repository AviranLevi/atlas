import { useRef, useEffect } from 'react';
import type { ChatMessage } from '@atlas/shared';
import { MessageBubble } from './MessageBubble';
import { StreamingBubble } from './StreamingBubble';
import type { StreamingToolCall } from '@/hooks/use-chat.hook';

interface MessageListProps {
  messages: ChatMessage[];
  streamingText: string;
  streamingToolCalls: StreamingToolCall[];
  isStreaming: boolean;
  pendingUserMessage?: string | null;
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
  }, [messages, streamingText, streamingToolCalls, isStreaming, pendingUserMessage]);

  const lastMessageIsFromUser = messages.length > 0 && messages[messages.length - 1]?.role === 'user';
  const showPendingMessage = pendingUserMessage && !lastMessageIsFromUser;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl py-4">
        {messages
          .filter((m) => m.role !== 'tool')
          .map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        {showPendingMessage && (
          <MessageBubble
            message={{
              id: '__pending__',
              conversationId: '',
              role: 'user',
              content: pendingUserMessage,
              toolCalls: null,
              toolResults: null,
              createdAt: new Date().toISOString(),
            }}
          />
        )}
        {isStreaming && (
          <StreamingBubble text={streamingText} toolCalls={streamingToolCalls} />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
