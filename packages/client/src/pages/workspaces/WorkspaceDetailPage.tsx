import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GitBranch,
  Clock,
  Terminal,
  Square,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  useWorkspaceStatus,
  useStopWork,
  useCleanupWorkspace,
} from '@/hooks/use-workspaces.hook';
import type { DiffComment } from '@my-agents/shared';
import { calcDuration } from '@/lib/format';
import { statusMeta } from './workspaces-page.constants';
import { DiffSection } from './diff';

// ─── Status icon ─────────────────────────────────────────────────────

function StatusIcon({ status, className }: { status: string; className?: string }) {
  if (status === 'running') return <Loader2 className={cn('animate-spin text-blue-500', className)} />;
  if (status === 'pending') return <Circle className={cn('text-yellow-500', className)} />;
  if (status === 'completed') return <CheckCircle2 className={cn('text-green-500', className)} />;
  if (status === 'failed') return <XCircle className={cn('text-red-500', className)} />;
  return <Square className={cn('text-gray-400', className)} />;
}

// ─── Page ────────────────────────────────────────────────────────────

export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workspace, isLoading, error } = useWorkspaceStatus(id);
  const stopWork = useStopWork();
  const cleanup = useCleanupWorkspace();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-sm text-muted-foreground">Workspace not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/workspaces')}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Workspaces
        </Button>
      </div>
    );
  }

  const meta = statusMeta[workspace.status] ?? statusMeta.stopped;
  const isActive = workspace.status === 'running' || workspace.status === 'pending';
  const canReview = workspace.status === 'completed';
  const comments: DiffComment[] = Array.isArray(workspace.diffComments) ? workspace.diffComments : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Back nav */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8" onClick={() => navigate('/workspaces')}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Workspaces
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <StatusIcon status={workspace.status} className="mt-1 h-6 w-6" />
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight">
              {workspace.taskName ?? 'Unknown task'}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={meta.badgeClass}>
                {meta.label}
              </Badge>
              {workspace.projectName && (
                <span className="text-sm text-muted-foreground">{workspace.projectName}</span>
              )}
              <span className="text-sm text-muted-foreground">{workspace.agentRuntime}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => stopWork.mutate(workspace.id, { onSuccess: () => navigate('/workspaces') })}
              disabled={stopWork.isPending}
            >
              <Square className="mr-1.5 h-3.5 w-3.5" />
              Stop Agent
            </Button>
          )}
          {!isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => cleanup.mutate(workspace.id, { onSuccess: () => navigate('/workspaces') })}
              disabled={cleanup.isPending}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clean Up
            </Button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <GitBranch className="h-3.5 w-3.5" />
            Branch
          </div>
          <p className="font-mono text-xs truncate" title={workspace.branchName}>
            {workspace.branchName}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock className="h-3.5 w-3.5" />
            Duration
          </div>
          <p className="text-sm font-medium">
            {calcDuration(workspace.startedAt, workspace.completedAt)}
          </p>
        </Card>
        {workspace.pid && (
          <Card className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Terminal className="h-3.5 w-3.5" />
              PID
            </div>
            <p className="text-sm font-medium">{workspace.pid}</p>
          </Card>
        )}
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock className="h-3.5 w-3.5" />
            Started
          </div>
          <p className="text-xs">
            {workspace.startedAt ? new Date(workspace.startedAt).toLocaleString() : '—'}
          </p>
        </Card>
      </div>

      {/* Diff view for completed workspaces */}
      {canReview && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Code Changes</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Hover over a line and click the comment icon to leave inline feedback.
          </p>
          <DiffSection workspaceId={workspace.id} comments={comments} />
        </div>
      )}

      {/* Agent output */}
      {(workspace.fullOutput || workspace.output) && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Agent Output</h2>
          <Card>
            <CardContent className="p-0">
              <pre className="max-h-[500px] overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {workspace.fullOutput ?? workspace.output}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
