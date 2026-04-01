// React / library
import { ChevronDown, ChevronUp, RefreshCw, Terminal } from 'lucide-react';
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ExecutorPopover } from './ExecutorPopover';

// Hooks
import { useAgentRuntimes, useRefreshRuntimes } from '@/hooks/use-workspaces.hook';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { AgentStatusPanelProps } from './layout.types';

export function AgentStatusPanel({ expanded }: AgentStatusPanelProps) {
  const { data: runtimes = [], isLoading } = useAgentRuntimes();
  const refreshRuntimes = useRefreshRuntimes();
  const [open, setOpen] = useState(true);

  const installed = runtimes.filter((r) => r.installed);
  const notInstalled = runtimes.filter((r) => !r.installed);
  const readyCount = runtimes.filter((r) => r.installed && r.authenticated).length;
  const hasUnauthenticated = installed.some((r) => !r.authenticated);

  if (isLoading) return null;

  if (!expanded) {
    return (
      <div className="border-t border-sidebar-border p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex w-9 h-9 items-center justify-center rounded-md text-sidebar-foreground">
              <div className="relative">
                <Terminal className="h-[18px] w-[18px]" />
                <span
                  className={cn(
                    'absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full',
                    readyCount > 0 ? (hasUnauthenticated ? 'bg-yellow-500' : 'bg-green-500') : 'bg-zinc-400',
                  )}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            {readyCount} agent{readyCount !== 1 ? 's' : ''} ready
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="border-t border-sidebar-border">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-sidebar-foreground transition-colors"
      >
        <span>Agent CLIs</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-normal normal-case">
            {readyCount}/{runtimes.length}
          </span>
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </div>
      </button>

      {open && (
        <div className="px-1.5 pb-2 space-y-0.5">
          {installed.map((rt) => (
            <ExecutorPopover
              key={rt.id}
              executor={rt}
              onRecheck={() => refreshRuntimes.mutate()}
              isRechecking={refreshRuntimes.isPending}
            />
          ))}
          {notInstalled.map((rt) => (
            <ExecutorPopover
              key={rt.id}
              executor={rt}
              onRecheck={() => refreshRuntimes.mutate()}
              isRechecking={refreshRuntimes.isPending}
            />
          ))}

          <div className="px-2.5 pt-1.5">
            <Button variant="ghost" size="sm" className="h-6 w-full text-[10px] text-muted-foreground" asChild>
              <button type="button" onClick={() => refreshRuntimes.mutate()} disabled={refreshRuntimes.isPending}>
                <RefreshCw className={cn('mr-1 h-3 w-3', refreshRuntimes.isPending && 'animate-spin')} />
                {refreshRuntimes.isPending ? 'Scanning...' : 'Rescan'}
              </button>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
