// React / library
import { Terminal, Activity } from 'lucide-react';
import { useState } from 'react';

// Components
import { Card } from '@/components/ui/card';
import { WorkspaceRow } from './components/WorkspaceRow';

// Hooks
import { useWorkspaces } from '@/hooks/use-workspaces.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Types
import type { StatusFilter } from './workspaces.types';

// Constants
import { filterTabs } from './workspaces.constants';

export function WorkspacesPage() {
  const { data: allWorkspaces = [], isLoading } = useWorkspaces();
  const { activeProjectId } = useActiveProject();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const workspaces = activeProjectId ? allWorkspaces.filter((w) => w.projectId === activeProjectId) : allWorkspaces;

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
      <div className="flex items-center gap-3">
        <Activity className="h-7 w-7 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Workspaces</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Monitor and manage agent execution environments</p>
        </div>
      </div>

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

      <div className="flex gap-1 border-b">
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

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading workspaces...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
          <Terminal className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {filter === 'all' ? 'No workspaces yet. Start an agent from the Kanban board.' : `No ${filter} workspaces.`}
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
