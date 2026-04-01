// React / library
import { Clock, GitBranch, Square, Terminal, Trash2 } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Hooks
import { useCleanupWorkspace, useStopWork } from '@/hooks/use-workspaces.hook';

// Types
import type { WorkspaceCardProps } from './workspaces.types';

// Constants
import { runningDuration, statusConfig } from './workspaces.constants';

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const stopWork = useStopWork();
  const cleanup = useCleanupWorkspace();
  const config = statusConfig[workspace.status] ?? statusConfig.pending;
  const isActive = workspace.status === 'running' || workspace.status === 'pending';

  return (
    <Card className="border-l-4" style={{ borderLeftColor: isActive ? '#3b82f6' : '#64748b' }}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm font-semibold leading-tight truncate">{workspace.taskName ?? 'Unknown task'}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`${config.className} text-[10px] px-1.5 py-0`}>
                {config.label}
              </Badge>
              {workspace.projectName && (
                <span className="text-muted-foreground text-[11px] truncate">{workspace.projectName}</span>
              )}
              <span className="text-muted-foreground text-[11px]">{workspace.agentRuntime}</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            {isActive && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    asChild
                  >
                    <button onClick={() => stopWork.mutate(workspace.id)} disabled={stopWork.isPending}>
                      <Square className="h-3.5 w-3.5" />
                    </button>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop Agent</TooltipContent>
              </Tooltip>
            )}
            {!isActive && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <button onClick={() => cleanup.mutate(workspace.id)} disabled={cleanup.isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cleanup</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          <span className="inline-flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            <span className="max-w-[160px] truncate">{workspace.branchName}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {runningDuration(workspace.startedAt)}
          </span>
          {workspace.pid && (
            <span className="inline-flex items-center gap-1">
              <Terminal className="h-3 w-3" />
              PID {workspace.pid}
            </span>
          )}
        </div>

        {workspace.output && (
          <pre className="bg-muted/50 max-h-24 overflow-auto rounded p-2 text-[10px] leading-relaxed font-mono">
            {workspace.output.slice(-500)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
