// React / library
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Play, Pencil, Trash2, Globe, FolderOpen } from 'lucide-react';

// Components
import { AutomationDialog } from '@/components/automations/AutomationDialog';
import { resolveIcon } from '@/components/automations/IconPicker';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useAutomations, useDeleteAutomation, useRunAutomation } from '@/hooks/use-automations.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Types
import type { Automation } from '@atlas/shared';

export function AutomationsPage() {
  const navigate = useNavigate();
  const { activeProjectId } = useActiveProject();
  const { data: automations = [], isLoading } = useAutomations(activeProjectId ?? undefined);
  const { data: agents = [] } = useAgents();
  const deleteAutomation = useDeleteAutomation();
  const runAutomation = useRunAutomation();

  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Deduplicate: project-scoped automations shadow globals with the same name
  const resolved = useMemo(() => {
    if (!activeProjectId) return automations;
    const projectNames = new Set(automations.filter((a) => a.projectId === activeProjectId).map((a) => a.name));
    return automations.filter((a) => a.projectId === activeProjectId || !projectNames.has(a.name));
  }, [automations, activeProjectId]);

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId)?.name ?? null;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading automations...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Automations</h1>
          <Badge variant="secondary" className="text-xs">
            {resolved.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setQuickAddOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Quick Add
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/automations/new')}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Automation
          </Button>
        </div>
      </div>

      {/* Content */}
      {resolved.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No automations yet"
          body="Automations let you run common workflows with one click — commit & push, code reviews, PR creation, and more."
          primaryCta={{ label: 'New Automation', onClick: () => navigate('/automations/new'), icon: Plus }}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {resolved.map((automation) => {
            const agentName = getAgentName(automation.agentId);
            const isGlobal = activeProjectId ? automation.projectId !== activeProjectId : !automation.projectId;

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
                  {automation.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{automation.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {activeProjectId && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => runAutomation.mutate({ id: automation.id, projectId: activeProjectId })}
                      disabled={runAutomation.isPending}
                    >
                      <Play className="mr-1 h-3.5 w-3.5" />
                      Run
                    </Button>
                  )}
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

      {/* Quick Add Dialog */}
      <AutomationDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        defaultProjectId={activeProjectId ?? undefined}
        onSaved={(created) => navigate(`/automations/${created.id}`)}
      />
    </div>
  );
}
