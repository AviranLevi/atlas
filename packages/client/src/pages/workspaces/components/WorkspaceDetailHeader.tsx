// React / library
import { Bot, FolderOpen, Square, Trash2, RotateCcw, ListPlus } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusIcon } from './StatusIcon';

// Types
import type { WorkspaceDetailHeaderProps } from '../workspaces.types';

// Constants
import { statusMeta } from '../workspaces.constants';
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

export function WorkspaceDetailHeader({
  workspace,
  view,
  onStop,
  onRerun,
  onFollowUp,
  onCleanup,
  onOpenInEditor,
  isStopping,
  isRerunning,
  isCleaning,
  isOpeningInEditor,
}: WorkspaceDetailHeaderProps) {
  const meta = statusMeta[workspace.status] ?? statusMeta.stopped;
  const { canStop, canRerun, canFollowUp, canCleanup, canOpenInEditor } = view.caps;
  // Single source of truth: the dedicated `aiReviewing` arm is the only
  // state in which the header chip should flip from "Running" to
  // "AI Reviewing". Inspecting workspace.status + review.status here
  // would duplicate the decision.
  const isReviewerRunning = view.kind === 'aiReviewing';

  return (
    <div data-tour={TOUR_TARGETS.workspaceHeader} className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <StatusIcon status={workspace.status} className="mt-1 h-6 w-6" />
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">{workspace.taskName ?? 'Unknown task'}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {isReviewerRunning ? (
              // Override the generic "Running" chip: the workspace row is
              // `running`, but the reviewer — not the implementer — is what's
              // live. `workspace.status` alone can't tell us that because the
              // server reuses the row; `view.kind === 'aiReviewing'` is the
              // single client-side signal that encodes it.
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
              >
                <Bot className="h-3.5 w-3.5" />
                AI Reviewing
              </Badge>
            ) : (
              <Badge variant="outline" className={meta.badgeClass}>
                {meta.label}
              </Badge>
            )}
            {workspace.projectName && <span className="text-sm text-muted-foreground">{workspace.projectName}</span>}
            <span className="text-sm text-muted-foreground">{workspace.agentRuntime}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {canOpenInEditor && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenInEditor}
            disabled={isOpeningInEditor}
            title="Open worktree in Cursor / VS Code"
          >
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
            {isOpeningInEditor ? 'Opening...' : 'Open in Editor'}
          </Button>
        )}
        {canStop && (
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={onStop}
            disabled={isStopping}
          >
            <Square className="mr-1.5 h-3.5 w-3.5" />
            Stop Agent
          </Button>
        )}
        {canRerun && (
          <Button variant="outline" size="sm" onClick={onRerun} disabled={isRerunning}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {isRerunning ? 'Re-running...' : 'Re-run'}
          </Button>
        )}
        {canFollowUp && (
          <Button data-tour={TOUR_TARGETS.workspaceFollowUp} variant="outline" size="sm" onClick={onFollowUp}>
            <ListPlus className="mr-1.5 h-3.5 w-3.5" />
            Follow-up Task
          </Button>
        )}
        {canCleanup && (
          <Button
            data-tour={TOUR_TARGETS.workspaceCleanup}
            variant="outline"
            size="sm"
            onClick={onCleanup}
            disabled={isCleaning}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clean Up
          </Button>
        )}
      </div>
    </div>
  );
}
