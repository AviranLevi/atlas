// React / library
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Pencil, Trash2 } from 'lucide-react';

// Components
import { AutomationDialog } from '@/components/automations/AutomationDialog';
import { resolveIcon } from '@/components/automations/IconPicker';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useAutomations, useDeleteAutomation } from '@/hooks/use-automations.hook';

export function AutomationsTab() {
  const navigate = useNavigate();
  const { data: automations = [], isLoading } = useAutomations();
  const { data: agents = [] } = useAgents();
  const deleteAutomation = useDeleteAutomation();

  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const globalAutomations = useMemo(() => automations.filter((a) => a.projectId === null), [automations]);

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId)?.name ?? null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Global Automations</CardTitle>
          <CardDescription>
            Automations defined here are available in all projects. Projects can override a global automation by
            creating one with the same name.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setQuickAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Quick Add
          </Button>
          <Button onClick={() => navigate('/automations/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Automation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center text-sm">Loading...</div>
        ) : globalAutomations.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No global automations"
            body="Global automations are reusable workflows available across all projects. Use templates to get started quickly."
            primaryCta={{ label: 'New Automation', onClick: () => navigate('/automations/new'), icon: Plus }}
            compact
          />
        ) : (
          <div className="flex flex-col gap-2">
            {globalAutomations.map((automation) => {
              const agentName = getAgentName(automation.agentId);

              const AutoIcon = resolveIcon(automation.icon);

              return (
                <div
                  key={automation.id}
                  className="group flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => navigate(`/automations/${automation.id}`)}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <AutoIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{automation.name}</p>
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
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <AutomationDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        onSaved={(created) => navigate(`/automations/${created.id}`)}
      />
    </Card>
  );
}
