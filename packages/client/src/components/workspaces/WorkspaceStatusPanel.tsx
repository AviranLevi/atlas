// React / library
import { Square, Trash2, Clock, GitBranch, Terminal } from 'lucide-react';
// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
// Hooks
import { useWorkspaces, useStopWork, useCleanupWorkspace } from '@/hooks/use-workspaces.hook';
// Types
import type { Workspace } from '@my-agents/shared';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  },
  running: {
    label: 'Running',
    className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  completed: {
    label: 'Completed',
    className: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  },
  failed: {
    label: 'Failed',
    className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  },
  stopped: {
    label: 'Stopped',
    className: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300',
  },
};

function runningDuration(startedAt: string | null): string {
  if (!startedAt) return '--';
  const diff = Date.now() - new Date(startedAt).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const stopWork = useStopWork();
  const cleanup = useCleanupWorkspace();
  const config = statusConfig[workspace.status] ?? statusConfig.pending;
  const isActive = workspace.status === 'running' || workspace.status === 'pending';

  return (
    <Card className="border-l-4" style={{ borderLeftColor: isActive ? '#3b82f6' : '#64748b' }}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <Badge variant="outline" className={config.className}>
              {config.label}
            </Badge>
            <p className="text-xs font-medium truncate">{workspace.agentRuntime}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            {isActive && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" asChild>
                    <button
                      onClick={() => stopWork.mutate(workspace.id)}
                      disabled={stopWork.isPending}
                    >
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
                    <button
                      onClick={() => cleanup.mutate(workspace.id)}
                      disabled={cleanup.isPending}
                    >
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
            <span className="max-w-[140px] truncate">{workspace.branchName}</span>
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

export function WorkspaceStatusPanel() {
  const { data: workspaces = [], isLoading } = useWorkspaces();

  const active = workspaces.filter((w) => w.status === 'running' || w.status === 'pending');
  const recent = workspaces
    .filter((w) => w.status !== 'running' && w.status !== 'pending')
    .slice(0, 5);

  if (isLoading) {
    return null;
  }

  if (workspaces.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          Agent Workspaces
          {active.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {active.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {active.map((ws) => (
          <WorkspaceCard key={ws.id} workspace={ws} />
        ))}
        {recent.length > 0 && active.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <p className="text-muted-foreground text-[10px] mb-1.5">Recent</p>
          </div>
        )}
        {recent.map((ws) => (
          <WorkspaceCard key={ws.id} workspace={ws} />
        ))}
      </CardContent>
    </Card>
  );
}
