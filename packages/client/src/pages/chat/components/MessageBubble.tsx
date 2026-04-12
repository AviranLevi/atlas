// React / library
import { User, Bot } from 'lucide-react';

// Components
import { MarkdownContent } from '@/components/ui/markdown-content';
import { AgentThinking } from './AgentThinking';
import { AttachmentPreview } from './AttachmentPreview';
import { parseAgentContent } from '../chat.utils';

// Types
import type { ChatToolCall } from '@atlas/shared';
import type { ThinkingStep, MessageBubbleProps } from '../chat.types';

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'tool') return null;

  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex flex-row-reverse gap-3 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
        <div className="flex max-w-[80%] items-end flex-col gap-1">
          {message.attachments && message.attachments.length > 0 && (
            <AttachmentPreview attachments={message.attachments} />
          )}
          {message.content && (
            <div className="rounded-lg bg-primary px-3 py-2 text-primary-foreground">
              <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const apiSteps: ThinkingStep[] | null =
    message.toolCalls && message.toolCalls.length > 0
      ? message.toolCalls.map((tc: ChatToolCall) => ({ id: tc.id, toolName: tc.name, hint: '' }))
      : null;

  const { steps, response } = apiSteps
    ? { steps: apiSteps, response: message.content }
    : parseAgentContent(message.content);

  // Tool-only messages (no response text) are rendered as grouped blocks by MessageList.
  // Skip here to avoid duplicate rendering.
  if (!response?.trim() && steps.length > 0) return null;

  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex min-w-0 max-w-[80%] flex-col gap-2">
        <AgentThinking steps={steps} isStreaming={false} />
        {response && (
          <div className="min-w-0 rounded-lg bg-muted px-3 py-2">
            <MarkdownContent content={response} />
          </div>
        )}
      </div>
    </div>
  );
}
