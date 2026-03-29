// React / library
import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';

// Components
import { MarkdownContent } from '@/components/ui/markdown-content';
import { AgentThinking } from './AgentThinking';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { ThinkingStep, StreamingBubbleProps } from './chat-page.types';

// Utils
import { parseAgentContent } from './chat-page.utils';

function useTypewriter(text: string, speed = 10) {
  const [pos, setPos] = useState(0);

  useEffect(() => {
    if (!text) {
      setPos(0);
      return;
    }
    if (pos >= text.length) return;
    const id = setTimeout(() => setPos((p) => Math.min(p + speed, text.length)), 16);
    return () => clearTimeout(id);
  }, [pos, text, speed]);

  return { displayed: text.slice(0, pos), done: pos >= text.length };
}

export function StreamingBubble({ text, toolCalls }: StreamingBubbleProps) {
  const isApiMode = toolCalls.length > 0;

  const apiSteps: ThinkingStep[] = toolCalls.map((tc) => ({
    id: tc.id,
    toolName: tc.name,
    hint: '',
    status: tc.status,
  }));

  const { steps: cliSteps, response: cliResponse } = parseAgentContent(text);

  const thinkingSteps = isApiMode ? apiSteps : cliSteps;
  const responseText = isApiMode ? text : cliResponse;

  const { displayed, done } = useTypewriter(responseText);

  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Bot className="h-4 w-4" />
      </div>
      <div className={cn('flex max-w-[80%] flex-col gap-2')}>
        <AgentThinking steps={thinkingSteps} isStreaming={true} />

        {responseText && (
          <div className="min-w-0 rounded-lg bg-muted px-3 py-2 animate-fade-in-up">
            <MarkdownContent content={displayed} />
            {!done && (
              <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-foreground/70 align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
