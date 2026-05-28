// React / library
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Play, Pencil, Trash2, Globe, FolderOpen } from 'lucide-react';

// Components
import { QuickActionDialog } from '@/components/quick-actions/QuickActionDialog';
import { resolveIcon } from '@/components/quick-actions/IconPicker';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useQuickActions, useDeleteQuickAction, useRunQuickAction } from '@/hooks/use-quick-actions.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Types
import type { QuickAction } from '@atlas/shared';

export function QuickActionsPage() {
  const navigate = useNavigate();
  const { activeProjectId } = useActiveProject();
  const { data: quickActions = [], isLoading } = useQuickActions(activeProjectId ?? undefined);
  const { data: agents = [] } = useAgents();
  const deleteQuickAction = useDeleteQuickAction();
  const runQuickAction = useRunQuickAction();

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Deduplicate: project-scoped quick actions shadow globals with the same name
  const resolved = useMemo(() => {
    if (!activeProjectId) return quickActions;
    const projectNames = new Set(quickActions.filter((a) => a.projectId === activeProjectId).map((a) => a.name));
    return quickActions.filter((a) => a.projectId === activeProjectId || !projectNames.has(a.name));
  }, [quickActions, activeProjectId]);

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId)?.name ?? null;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading quick actions...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Quick Actions</h1>
          <Badge variant="secondary" className="text-xs">
            {resolved.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setQuickAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Quick Add
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/quick-actions/new')}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Quick Action
          </Button>
        </div>
      </div>

      {/* Content */}
      {resolved.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No quick actions yet"
          body="Quick actions let you run common workflows with one click — commit & push, code reviews, PR creation, and more."
          primaryCta={{ label: 'New Quick Action', onClick: () => navigate('/quick-actions/new'), icon: Plus }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {resolved.map((quickAction) => {
            const agentName = getAgentName(quickAction.agentId);
            const isGlobal = activeProjectId ? quickAction.projectId !== activeProjectId : !quickAction.projectId;

            const ActionIcon = resolveIcon(quickAction.icon);

            return (
              <Card
                key={quickAction.id}
                className="group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/quick-actions/${quickAction.id}`)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <ActionIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{quickAction.name}</p>
                    {activeProjectId && (
                      <Badge variant={isGlobal ? 'outline' : 'secondary'} className="text-[10px] shrink-0">
                        {isGlobal ? (
                          <span className="flex items-center gap-1">
                            <Globe className="h-2.5 w-2.5" />
                            Global
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FolderOpen className="h-2.5 w-2.5" />
                            Project
                          </span>
                        )}
                      </Badge>
                    )}
                    {agentName && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {agentName}
                      </Badge>
                    )}
                  </div>
                  {quickAction.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{quickAction.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {activeProjectId && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => runQuickAction.mutate({ id: quickAction.id, projectId: activeProjectId })}
                      disabled={runQuickAction.isPending}
                    >
                      <Play className="mr-1 h-3.5 w-3.5" />
                      Run
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => navigate(`/quick-actions/${quickAction.id}`)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteId(quickAction.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Add Dialog */}
      <QuickActionDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        defaultProjectId={activeProjectId ?? undefined}
        onSaved={(created) => navigate(`/quick-actions/${created.id}`)}
      />

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete quick action"
        description="This will permanently delete the quick action. This action cannot be undone."
        isPending={deleteQuickAction.isPending}
        onConfirm={() => {
          if (deleteId) {
            deleteQuickAction.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
          }
        }}
      />
    </div>
  );
}
