// React / library
import { ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { AgentThinkingProps } from './chat-page.types';

function BounceDots({ size = 1.5 }: { size?: number }) {
  return (
    <span className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block rounded-full bg-muted-foreground"
          style={{
            width: `${size * 4}px`,
            height: `${size * 4}px`,
            animation: `bounce-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

export function AgentThinking({ steps, isStreaming }: AgentThinkingProps) {
  const [open, setOpen] = useState(isStreaming);

  if (steps.length === 0 && !isStreaming) return null;

  const label = isStreaming ? 'Thinking…' : steps.length === 1 ? '1 step' : `${steps.length} steps`;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 text-xs animate-fade-in-up overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {isStreaming ? <BounceDots /> : <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />}
        <span className="flex-1 font-medium text-muted-foreground">{label}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="border-t border-border/40 px-3 py-2 space-y-1.5">
          {steps.length === 0 && <p className="text-muted-foreground/50 py-0.5">Waiting…</p>}
          {steps.map((step) => (
            <div key={step.id} className="flex items-baseline gap-1.5 font-mono animate-fade-in-up">
              <span className="shrink-0 text-muted-foreground/40">▸</span>
              <span className="font-semibold text-muted-foreground">{step.toolName}</span>
              {step.hint && <span className="truncate text-muted-foreground/50">{step.hint}</span>}
              {step.status === 'pending' && (
                <span className="ml-auto shrink-0">
                  <BounceDots size={1} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
