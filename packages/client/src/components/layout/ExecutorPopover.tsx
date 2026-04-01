// React / library
import { Check, Copy, ExternalLink, RefreshCw, Terminal } from 'lucide-react';
import { useCallback, useState } from 'react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { CopyCommandProps, ExecutorPopoverProps } from './layout.types';

function CopyCommand({ label, command }: CopyCommandProps) {
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

export function ExecutorPopover({ executor, onRecheck, isRechecking }: ExecutorPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-accent',
            !executor.installed && 'opacity-50',
          )}
        >
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              !executor.installed
                ? 'bg-zinc-400 dark:bg-zinc-600'
                : executor.authenticated
                  ? 'bg-green-500'
                  : 'bg-yellow-500',
            )}
          />
          <span className="flex-1 truncate font-medium">{executor.name}</span>
          {executor.installed && executor.version && (
            <span className="shrink-0 text-[10px] text-muted-foreground font-mono">{executor.version}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end" className="w-72 p-0">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold">{executor.name}</h4>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{executor.description}</p>
        </div>
        <div className="px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            {!executor.installed ? (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Not found
              </Badge>
            ) : executor.authenticated ? (
              <Badge
                variant="outline"
                className="text-[10px] border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
              >
                Ready
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
              >
                Not authenticated
              </Badge>
            )}
          </div>
          {executor.version && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Version</span>
              <span className="text-xs font-mono">{executor.version}</span>
            </div>
          )}
          {executor.binaryPath && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Path</span>
              <span className="text-xs font-mono truncate text-right" title={executor.binaryPath}>
                {executor.binaryPath}
              </span>
            </div>
          )}
          {executor.mcpConfigFormat !== 'none' && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">MCP Support</span>
              <Badge variant="secondary" className="text-[10px]">
                {executor.mcpConfigFormat}
              </Badge>
            </div>
          )}
        </div>

        {executor.setup && (!executor.installed || !executor.authenticated) && (
          <div className="border-t px-4 py-3 space-y-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Setup</span>
            {!executor.installed && <CopyCommand label="1. Install" command={executor.setup.install} />}
            {executor.installed && !executor.authenticated && executor.setup.auth && (
              <CopyCommand label="Authenticate" command={executor.setup.auth} />
            )}
            {!executor.installed && executor.setup.auth && (
              <CopyCommand label="2. Authenticate" command={executor.setup.auth} />
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-full text-[11px] mt-2"
              onClick={onRecheck}
              disabled={isRechecking}
            >
              <RefreshCw className={cn('mr-1.5 h-3 w-3', isRechecking && 'animate-spin')} />
              {isRechecking ? 'Checking...' : 'Recheck'}
            </Button>
          </div>
        )}

        {executor.docsUrl && (
          <div className="border-t px-4 py-2.5">
            <a
              href={executor.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Documentation
            </a>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
