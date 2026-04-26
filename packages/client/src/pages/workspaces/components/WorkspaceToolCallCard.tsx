// React / library
import { CheckCircle2, Loader2 } from 'lucide-react';

// Lib
import { cn } from '@/lib/utils';
import { getToolMeta } from '../lib/tool-meta';

type WorkspaceToolCallCardProps = {
  tool: string;
  args: string;
  isRunning: boolean;
};

export function WorkspaceToolCallCard({ tool, args, isRunning }: WorkspaceToolCallCardProps) {
  const meta = getToolMeta(tool);
  const Icon = meta.icon;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
          meta.colorClass,
        )}
      >
        <Icon className="h-3 w-3" />
        {meta.label}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground" title={args}>
        {args}
      </span>
      {isRunning ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
      )}
    </div>
  );
}
