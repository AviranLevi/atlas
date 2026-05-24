// React / library
import { useState } from 'react';
import {
  GitBranch,
  Clock,
  Square,
  Trash2,
  ChevronRight,
  FileCode,
  CheckCircle2,
  Sparkles,
  ListChecks,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CleanupConfirmDialog } from '@/components/workspaces/CleanupConfirmDialog';
import { StatusIcon } from './StatusIcon';

// Hooks
import { useStopWork } from '@/hooks/use-workspaces.hook';

// Lib
import { calcDuration } from '@/lib/format';

// Types
import type { WorkspaceRowProps } from '../workspaces.types';

// Constants
import { statusMeta } from '../workspaces.constants';
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

const STAGE_META: Record<string, { label: string; icon: typeof Sparkles; className: string }> = {
  brainstorm: {
    label: 'Brainstorm',
    icon: Sparkles,
    className:
      'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
  },
  plan: {
    label: 'Plan',
    icon: ListChecks,
    className: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  execute: {
    label: 'Execute',
    icon: Play,
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
};

export function WorkspaceRow({ workspace }: WorkspaceRowProps) {
  const stopWork = useStopWork();
  const [cleanupOpen, setCleanupOpen] = useState(false);

  const meta = statusMeta[workspace.status] ?? statusMeta.stopped;
  const isActive = workspace.status === 'running' || workspace.status === 'pending';
  const isStructuredStage = workspace.workflowStage === 'brainstorm' || workspace.workflowStage === 'plan';
  const isWorkflowAwaitingApproval = workspace.status === 'completed' && isStructuredStage;
  const isApproved = workspace.status === 'approved';
  const canReview = workspace.status === 'completed' && !isWorkflowAwaitingApproval;
  const canCleanup = !isActive && workspace.status !== 'merged' && workspace.status !== 'approved';
  const stageMeta = workspace.workflowStage ? STAGE_META[workspace.workflowStage] : null;

  return (
    <Card
      data-tour={TOUR_TARGETS.workspacesRow}
      className="border-l-[3px] transition-shadow hover:shadow-md"
      style={{ borderLeftColor: meta.leftColor }}
    >
      <Link to={`/workspaces/${workspace.id}`} className="flex items-center gap-3 p-4">
        <div className="shrink-0">
          <StatusIcon status={workspace.status} className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{workspace.taskName ?? 'Unknown task'}</h3>
            {stageMeta && (
              <Badge variant="outline" className={`shrink-0 text-[10px] ${stageMeta.className}`}>
                <stageMeta.icon className="mr-1 h-2.5 w-2.5" />
                {stageMeta.label}
              </Badge>
            )}
            {isWorkflowAwaitingApproval && (
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              >
                <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                Awaiting Approval
              </Badge>
            )}
            {isApproved && (
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              >
                <CheckCircle2 className="mr-1 h-2.5 w-2.5" />
                Approved
              </Badge>
            )}
            {canReview && !isApproved && (
              <Badge
                variant="outline"
                className="shrink-0 text-[10px] border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"
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
                    setCleanupOpen(true);
                  }}
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

      <CleanupConfirmDialog open={cleanupOpen} onOpenChange={setCleanupOpen} workspace={workspace} />
    </Card>
  );
}
