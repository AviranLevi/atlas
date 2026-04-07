// React / library
import { Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

// Types
import type { ChatToolCall } from '@atlas/shared';

interface ToolCallCardProps {
  toolCall: ChatToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-border bg-muted/50 text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-1.5 transition-colors hover:bg-muted/80"
      >
        <Wrench className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="font-medium">{formatToolName(toolCall.name)}</span>
        {expanded ? <ChevronDown className="ml-auto h-3 w-3" /> : <ChevronRight className="ml-auto h-3 w-3" />}
      </button>
      {expanded && (
        <div className="border-t border-border px-3 py-2">
          <pre className="max-h-40 overflow-auto text-xs text-muted-foreground">
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
