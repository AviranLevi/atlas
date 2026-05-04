// React / library
import { Check, Copy } from 'lucide-react';
import { useCallback, useState } from 'react';

// Types
import type { CopyCommandProps } from './executor-popover.types';

export function CopyCommand({ label, command }: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <div className="space-y-1">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex w-full items-center justify-between gap-2 rounded bg-muted px-2.5 py-1.5 text-left font-mono text-[11px] transition-colors hover:bg-muted/80"
      >
        <span className="truncate">{command}</span>
        {copied ? (
          <Check className="h-3 w-3 shrink-0 text-green-500" />
        ) : (
          <Copy className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
