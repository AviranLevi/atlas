import type { ChatMessage } from '@my-agents/shared';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { User, Bot, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolCallCard } from './ToolCallCard';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'tool') return null;

  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser ? 'flex-row-reverse' : '')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn('flex max-w-[80%] flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-lg px-3 py-2',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex w-full flex-col gap-1">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StreamingBubbleProps {
  text: string;
  toolCalls: Array<{
    id: string;
    name: string;
    args: Record<string, unknown>;
    result?: unknown;
    status: 'pending' | 'done';
  }>;
}

export function StreamingBubble({ text, toolCalls }: StreamingBubbleProps) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex max-w-[80%] flex-col gap-1">
        {toolCalls.length > 0 && (
          <div className="flex w-full flex-col gap-1">
            {toolCalls.map((tc) => (
              <div
                key={tc.id}
                className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs"
              >
                <Wrench className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{formatToolName(tc.name)}</span>
                {tc.status === 'pending' && (
                  <span className="animate-pulse text-muted-foreground">running...</span>
                )}
                {tc.status === 'done' && <span className="text-green-500">done</span>}
              </div>
            ))}
          </div>
        )}
        {text && (
          <div className="rounded-lg bg-muted px-3 py-2">
            <MarkdownContent content={text} />
            <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-foreground/70" />
          </div>
        )}
        {!text && toolCalls.length === 0 && (
          <div className="rounded-lg bg-muted px-3 py-2">
            <span className="inline-block h-4 w-2 animate-pulse bg-foreground/70" />
          </div>
        )}
      </div>
    </div>
  );
}

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
