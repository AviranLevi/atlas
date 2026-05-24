// React / library
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Pencil, Trash2 } from 'lucide-react';

// Components
import { QuickActionDialog } from '@/components/quick-actions/QuickActionDialog';
import { resolveIcon } from '@/components/quick-actions/IconPicker';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useQuickActions, useDeleteQuickAction } from '@/hooks/use-quick-actions.hook';

export function QuickActionsTab() {
  const navigate = useNavigate();
  const { data: quickActions = [], isLoading } = useQuickActions();
  const { data: agents = [] } = useAgents();
  const deleteQuickAction = useDeleteQuickAction();

  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const globalQuickActions = useMemo(() => quickActions.filter((a) => a.projectId === null), [quickActions]);

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId)?.name ?? null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Global Quick Actions</CardTitle>
          <CardDescription>
            Quick actions defined here are available in all projects. Projects can override a global quick action by
            creating one with the same name.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setQuickAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Quick Add
          </Button>
          <Button onClick={() => navigate('/quick-actions/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Quick Action
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center text-sm">Loading...</div>
        ) : globalQuickActions.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No global quick actions"
            body="Global quick actions are reusable workflows available across all projects. Use templates to get started quickly."
            primaryCta={{ label: 'New Quick Action', onClick: () => navigate('/quick-actions/new'), icon: Plus }}
            compact
          />
        ) : (
          <div className="flex flex-col gap-2">
            {globalQuickActions.map((quickAction) => {
              const agentName = getAgentName(quickAction.agentId);
              const ActionIcon = resolveIcon(quickAction.icon);

              return (
                <div
                  key={quickAction.id}
                  className="group flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => navigate('/quick-actions/' + quickAction.id)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ActionIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{quickAction.name}</p>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => navigate('/quick-actions/' + quickAction.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteQuickAction.mutate(quickAction.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <QuickActionDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSaved={(created) => navigate('/quick-actions/' + created.id)}
      />
    </Card>
  );
}
