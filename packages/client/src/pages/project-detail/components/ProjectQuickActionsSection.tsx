// React / library
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Play, Pencil, Trash2, Globe, FolderOpen } from 'lucide-react';

// Components
import { resolveIcon } from '@/components/quick-actions/IconPicker';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useQuickActions, useDeleteQuickAction, useRunQuickAction } from '@/hooks/use-quick-actions.hook';

type ProjectQuickActionsSectionProps = {
  projectId: string;
};

export function ProjectQuickActionsSection({ projectId }: ProjectQuickActionsSectionProps) {
  const navigate = useNavigate();
  const { data: quickActions = [], isLoading } = useQuickActions(projectId);
  const { data: agents = [] } = useAgents();
  const deleteQuickAction = useDeleteQuickAction();
  const runQuickAction = useRunQuickAction();

  const resolved = useMemo(() => {
    const projectNames = new Set(quickActions.filter((a) => a.projectId === projectId).map((a) => a.name));
    return quickActions.filter((a) => a.projectId === projectId || !projectNames.has(a.name));
  }, [quickActions, projectId]);

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId)?.name ?? null;
  };

  if (isLoading) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold">Quick Actions ({resolved.length})</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/quick-actions')}>
            View All
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/quick-actions/new')}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Quick Action
          </Button>
        </div>
      </div>

      {resolved.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No quick actions"
          body="Quick actions let you run common workflows with one click — write tests, fix lint errors, refactor code, and more."
          primaryCta={{ label: 'Add Quick Action', onClick: () => navigate('/quick-actions/new'), icon: Plus }}
          compact
        />
      ) : (
        <div className="flex flex-col gap-2">
          {resolved.map((quickAction) => {
            const agentName = getAgentName(quickAction.agentId);
            const isGlobal = quickAction.projectId !== projectId;

            const ActionIcon = resolveIcon(quickAction.icon);

            return (
              <Card
                key={quickAction.id}
                className="group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate('/quick-actions/' + quickAction.id)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <ActionIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{quickAction.name}</p>
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
                    variant="default"
                    size="sm"
                    onClick={() => runQuickAction.mutate({ id: quickAction.id, projectId })}
                    disabled={runQuickAction.isPending}
                  >
                    <Play className="mr-1 h-3.5 w-3.5" />
                    Run
                  </Button>
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
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
