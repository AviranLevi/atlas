// React / library
import { Terminal, Activity } from 'lucide-react';
import { useState } from 'react';

// Components
import { EmptyState } from '@/components/empty-state/EmptyState';
import { ErrorState } from '@/components/error-state/ErrorState';
import { Card } from '@/components/ui/card';
import { WorkspaceRow } from './components/WorkspaceRow';

// Hooks
import { useWorkspaces } from '@/hooks/use-workspaces.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Types
import type { StatusFilter } from './workspaces.types';

// Constants
import { bucketOfWorkspace, filterTabs } from './workspaces.constants';
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

export function WorkspacesPage() {
  const { data: allWorkspaces = [], isLoading, isError, refetch } = useWorkspaces();
  const { activeProjectId } = useActiveProject();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const workspaces = activeProjectId ? allWorkspaces.filter((w) => w.projectId === activeProjectId) : allWorkspaces;

  const counts: Record<StatusFilter, number> = {
    all: workspaces.length,
    active: 0,
    awaitingApproval: 0,
    needsReview: 0,
    approved: 0,
    merged: 0,
    failed: 0,
    stopped: 0,
  };
  for (const w of workspaces) {
    counts[bucketOfWorkspace(w)] += 1;
  }

  const visible = workspaces.filter((w) => filter === 'all' || bucketOfWorkspace(w) === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Activity className="h-7 w-7 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Workspaces</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Monitor and manage agent execution environments</p>
        </div>
      </div>

      <div data-tour={TOUR_TARGETS.workspacesStats} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[
          { label: 'Active', count: counts.active, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Awaiting Approval', count: counts.awaitingApproval, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Needs Review', count: counts.needsReview, color: 'text-sky-600 dark:text-sky-400' },
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

      <div data-tour={TOUR_TARGETS.workspacesStatusTabs} className="flex gap-1 border-b">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
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
                  filter === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState message="Failed to load workspaces." onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading workspaces...</p>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Terminal}
          title={filter === 'all' ? 'No workspaces yet' : `No ${filter} workspaces`}
          body="A workspace is an isolated git worktree where an agent runs. Start work on any task from the Kanban board to spin one up."
          primaryCta={{ label: 'Open Kanban', asLink: { to: '/kanban' } }}
          compact
        />
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
