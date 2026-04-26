// React / library
import { Bot, Plus, Pencil, Trash2, Upload } from 'lucide-react';

// Components
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Lib
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

// Types
import type { AgentsSectionProps } from '../agents.types';

export function AgentsSection({
  agents,
  isLoading,
  onCreate,
  onImport,
  onEdit,
  onDelete,
  onNavigate,
}: AgentsSectionProps) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Manage your AI agent configurations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onImport} data-tour={TOUR_TARGETS.agentsImport}>
            <Upload className="mr-1.5 h-4 w-4" />
            Import
          </Button>
          <Button onClick={onCreate} size="sm" data-tour={TOUR_TARGETS.agentsNewAgent}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Agent
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">Loading...</div>
      ) : !agents?.length ? (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          body="An agent is a named persona — a system prompt + a model. Create one to start delegating work."
          primaryCta={{ label: 'Create Agent', onClick: onCreate, icon: Plus }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              data-tour={TOUR_TARGETS.agentsCard}
              className="group relative flex cursor-pointer flex-col gap-1.5 p-4 transition-shadow hover:shadow-md"
              onClick={() => onNavigate(agent.id)}
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                  <Bot className="text-primary h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{agent.name}</h3>
                  {agent.description && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
                      {agent.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => onEdit(e, agent)}
                  aria-label="Edit agent"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => onDelete(e, agent.id)}
                  aria-label="Delete agent"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
