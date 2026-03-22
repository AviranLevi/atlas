import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal,
  GitBranch,
  GitMerge,
  Clock,
  Square,
  Trash2,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  FileCode,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useWorkspaces,
  useStopWork,
  useCleanupWorkspace,
} from '@/hooks/use-workspaces.hook';
import { useActiveProject } from '@/contexts/ProjectContext';
import type { Workspace } from '@my-agents/shared';
import type { StatusFilter } from './workspaces-page.types';
import { statusMeta, filterTabs } from './workspaces-page.constants';
import { calcDuration } from '@/lib/format';

function StatusIcon({ status }: { status: string }) {
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  if (status === 'pending') return <Circle className="h-4 w-4 text-yellow-500" />;
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === 'merged') return <GitMerge className="h-4 w-4 text-violet-500" />;
  if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />;
  return <Square className="h-4 w-4 text-gray-400" />;
}

function WorkspaceRow({ workspace }: { workspace: Workspace }) {
  const stopWork = useStopWork();
  const cleanup = useCleanupWorkspace();

  const meta = statusMeta[workspace.status] ?? statusMeta.stopped;
  const isActive = workspace.status === 'running' || workspace.status === 'pending';
  const isMerged = workspace.status === 'merged';
  const canReview = workspace.status === 'completed';
  const canCleanup = !isActive && !isMerged;

  return (
    <Card
      className="border-l-[3px] transition-shadow hover:shadow-md"
      style={{ borderLeftColor: meta.leftColor }}
    >
      <Link
        to={`/workspaces/${workspace.id}`}
        className="flex items-center gap-3 p-4"
      >
        <div className="shrink-0">
          <StatusIcon status={workspace.status} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">
              {workspace.taskName ?? 'Unknown task'}
            </h3>
            {canReview && (
              <Badge variant="outline" className="shrink-0 text-[10px] border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
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

        {/* Actions (stop event propagation to avoid navigation) */}
        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.preventDefault()}>
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

export function WorkspacesPage() {
  const { data: allWorkspaces = [], isLoading } = useWorkspaces();
  const { activeProjectId } = useActiveProject();
  const [filter, setFilter] = useState<StatusFilter>('all');

  // Scope workspaces by active project tab
  const workspaces = activeProjectId
    ? allWorkspaces.filter((w) => w.projectId === activeProjectId)
    : allWorkspaces;

  const counts: Record<StatusFilter, number> = {
    all: workspaces.length,
    active: workspaces.filter((w) => w.status === 'running' || w.status === 'pending').length,
    completed: workspaces.filter((w) => w.status === 'completed').length,
    merged: workspaces.filter((w) => w.status === 'merged').length,
    failed: workspaces.filter((w) => w.status === 'failed').length,
    stopped: workspaces.filter((w) => w.status === 'stopped').length,
  };

  const visible = workspaces.filter((w) => {
    if (filter === 'all') return true;
    if (filter === 'active') return w.status === 'running' || w.status === 'pending';
    return w.status === filter;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="h-7 w-7 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Workspaces</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Monitor and manage agent execution environments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Active', count: counts.active, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Completed', count: counts.completed, color: 'text-green-600 dark:text-green-400' },
          { label: 'Merged', count: counts.merged, color: 'text-violet-600 dark:text-violet-400' },
          { label: 'Failed', count: counts.failed, color: 'text-red-600 dark:text-red-400' },
          { label: 'Total', count: counts.all, color: 'text-muted-foreground' },
        ].map((s) => (
          <Card key={s.label} className="flex flex-col items-center gap-1 p-4">
            <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  filter === tab.key
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading workspaces...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
          <Terminal className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {filter === 'all'
              ? 'No workspaces yet. Start an agent from the Kanban board.'
              : `No ${filter} workspaces.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((ws) => (
            <WorkspaceRow key={ws.id} workspace={ws} />
          ))}
        </div>
      )}
    </div>
  );
}
