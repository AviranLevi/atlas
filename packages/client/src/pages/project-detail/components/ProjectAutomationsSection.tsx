// React / library
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Play, Pencil, Trash2, Globe, FolderOpen } from 'lucide-react';

// Components
import { resolveIcon } from '@/components/automations/IconPicker';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useAutomations, useDeleteAutomation, useRunAutomation } from '@/hooks/use-automations.hook';

type ProjectAutomationsSectionProps = {
  projectId: string;
};

export function ProjectAutomationsSection({ projectId }: ProjectAutomationsSectionProps) {
  const navigate = useNavigate();
  const { data: automations = [], isLoading } = useAutomations(projectId);
  const { data: agents = [] } = useAgents();
  const deleteAutomation = useDeleteAutomation();
  const runAutomation = useRunAutomation();

  const resolved = useMemo(() => {
    const projectNames = new Set(automations.filter((a) => a.projectId === projectId).map((a) => a.name));
    return automations.filter((a) => a.projectId === projectId || !projectNames.has(a.name));
  }, [automations, projectId]);

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
          <h2 className="text-sm font-semibold">Automations ({resolved.length})</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/automations')}>
            View All
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/automations/new')}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Automation
          </Button>
        </div>
      </div>

      {resolved.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No automations"
          body="Automations let you run common workflows with one click — commit & push, code reviews, PR creation, and more."
          primaryCta={{ label: 'Add Automation', onClick: () => navigate('/automations/new'), icon: Plus }}
          compact
        />
      ) : (
        <div className="flex flex-col gap-2">
          {resolved.map((automation) => {
            const agentName = getAgentName(automation.agentId);
            const isGlobal = automation.projectId !== projectId;

            const AutoIcon = resolveIcon(automation.icon);

            return (
              <Card
                key={automation.id}
                className="group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/automations/${automation.id}`)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <AutoIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{automation.name}</p>
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
                  {automation.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{automation.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => runAutomation.mutate({ id: automation.id, projectId })}
                    disabled={runAutomation.isPending}
                  >
                    <Play className="mr-1 h-3.5 w-3.5" />
                    Run
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => navigate(`/automations/${automation.id}`)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteAutomation.mutate(automation.id)}
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
