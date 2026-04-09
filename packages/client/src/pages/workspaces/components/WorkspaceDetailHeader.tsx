// React / library
import { FolderOpen, Square, Trash2, RotateCcw, ListPlus } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusIcon } from './StatusIcon';

// Types
import type { WorkspaceDetailHeaderProps } from '../workspaces.types';

// Constants
import { statusMeta } from '../workspaces.constants';

export function WorkspaceDetailHeader({
  workspace,
  isActive,
  canReview,
  canRerun,
  canCleanup,
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

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <StatusIcon status={workspace.status} className="mt-1 h-6 w-6" />
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">{workspace.taskName ?? 'Unknown task'}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={meta.badgeClass}>
              {meta.label}
            </Badge>
            {workspace.projectName && <span className="text-sm text-muted-foreground">{workspace.projectName}</span>}
            <span className="text-sm text-muted-foreground">{workspace.agentRuntime}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
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
        {isActive && (
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
        {canReview && (
          <Button variant="outline" size="sm" onClick={onFollowUp}>
            <ListPlus className="mr-1.5 h-3.5 w-3.5" />
            Follow-up Task
          </Button>
        )}
        {canCleanup && (
          <Button variant="outline" size="sm" onClick={onCleanup} disabled={isCleaning}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clean Up
          </Button>
        )}
      </div>
    </div>
  );
}
