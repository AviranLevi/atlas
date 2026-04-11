// React / library
import { GitBranch, Clock, Square, Trash2, ChevronRight, FileCode, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusIcon } from './StatusIcon';

// Hooks
import { useStopWork, useCleanupWorkspace } from '@/hooks/use-workspaces.hook';

// Lib
import { calcDuration } from '@/lib/format';

// Types
import type { WorkspaceRowProps } from '../workspaces.types';

// Constants
import { statusMeta } from '../workspaces.constants';

export function WorkspaceRow({ workspace }: WorkspaceRowProps) {
  const stopWork = useStopWork();
  const cleanup = useCleanupWorkspace();

  const meta = statusMeta[workspace.status] ?? statusMeta.stopped;
  const isActive = workspace.status === 'running' || workspace.status === 'pending';
  const isWorkflowAwaitingApproval =
    workspace.status === 'completed' &&
    (workspace.workflowStage === 'brainstorm' || workspace.workflowStage === 'plan');
  const canReview = workspace.status === 'completed' && !isWorkflowAwaitingApproval;
  const canCleanup = !isActive && workspace.status !== 'merged';

  return (
    <Card className="border-l-[3px] transition-shadow hover:shadow-md" style={{ borderLeftColor: meta.leftColor }}>
      <Link to={`/workspaces/${workspace.id}`} className="flex items-center gap-3 p-4">
        <div className="shrink-0">
          <StatusIcon status={workspace.status} className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{workspace.taskName ?? 'Unknown task'}</h3>
            {isWorkflowAwaitingApproval && (
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              >
                <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                Awaiting Approval
              </Badge>
            )}
            {canReview && (
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
              >
                <FileCode className="mr-1 h-2.5 w-2.5" />
                Review
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${meta.badgeClass}`}>
              {meta.label}
            </Badge>
            {workspace.projectName && <span>{workspace.projectName}</span>}
            <span>{workspace.agentRuntime}</span>
            <span className="inline-flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span className="max-w-[180px] truncate font-mono">{workspace.branchName}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {calcDuration(workspace.startedAt, workspace.completedAt)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isActive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.preventDefault();
                    stopWork.mutate(workspace.id);
                  }}
                  disabled={stopWork.isPending}
                >
                  <Square className="mr-1 h-3 w-3" />
                  Stop
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop agent</TooltipContent>
            </Tooltip>
          )}
          {canCleanup && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    cleanup.mutate(workspace.id);
                  }}
                  disabled={cleanup.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clean up</TooltipContent>
            </Tooltip>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Link>
    </Card>
  );
}
