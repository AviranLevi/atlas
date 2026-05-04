// React / library
import { ArrowUpCircle, ExternalLink, RefreshCw, Terminal } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CopyCommand } from './CopyCommand';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { ExecutorPopoverProps } from './executor-popover.types';

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
            <span className="shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
              {executor.version}
              {executor.latestVersion && executor.latestVersion !== executor.version && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Update available" />
              )}
            </span>
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
          {executor.installed &&
            executor.version &&
            executor.latestVersion &&
            executor.latestVersion !== executor.version && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Update</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 gap-1"
                  >
                    <ArrowUpCircle className="h-2.5 w-2.5" />
                    {executor.latestVersion} available
                  </Badge>
                </div>
                {executor.setup && <CopyCommand label="Update command" command={executor.setup.install} />}
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
