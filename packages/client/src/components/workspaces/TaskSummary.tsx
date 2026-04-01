// Types
import type { TaskSummaryProps } from './workspaces.types';

export function TaskSummary({ name, projectName, agentName, priority }: TaskSummaryProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
      <p className="font-medium text-sm">{name}</p>
      {projectName && <p className="text-muted-foreground text-xs">Project: {projectName}</p>}
      {agentName && <p className="text-muted-foreground text-xs">Agent: {agentName}</p>}
      {priority && <p className="text-muted-foreground text-xs">Priority: {priority}</p>}
    </div>
  );
}
