// React / library
import { Users, UserPlus, Plus, X } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Types
import type { ProjectAgentsSectionProps } from './project-detail-page.types';

export function ProjectAgentsSection({
  projectId,
  projectAgents,
  unassignedAgents,
  assignPopoverOpen,
  onAssignPopoverOpenChange,
  onAssign,
  onUnassign,
}: ProjectAgentsSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold">Assigned Agents ({projectAgents.length})</h2>
        </div>
        <Popover open={assignPopoverOpen} onOpenChange={onAssignPopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Assign Agent
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Available Agents</p>
            {unassignedAgents.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">All agents are assigned.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {unassignedAgents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                    onClick={() => {
                      onAssign(agent.id);
                      onAssignPopoverOpenChange(false);
                    }}
                  >
                    <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate">{agent.name}</span>
                    <Plus className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {projectAgents.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-muted-foreground">
          <Users className="h-5 w-5 shrink-0 opacity-50" />
          <div>
            <p className="text-xs font-medium">No agents assigned</p>
            <p className="text-xs opacity-70">Assign agents to scope their work to this project.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {projectAgents.map((agent) => (
            <Card key={agent.id} className="group relative flex items-center gap-2 px-3 py-2">
              <div className="bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                {agent.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{agent.name}</p>
                {agent.role && (
                  <Badge variant="secondary" className="text-[10px]">{agent.role}</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onUnassign(agent.id)}
                aria-label={`Remove ${agent.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
