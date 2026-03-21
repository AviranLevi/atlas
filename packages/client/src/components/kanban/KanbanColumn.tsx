import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { KanbanCard } from './KanbanCard';
import type { KanbanColumnProps } from './kanban.types';

export function KanbanColumn({
  status,
  tasks,
  onEdit,
  onDelete,
  onStartWork,
  agentMap,
  projectMap,
  showProject,
  canStartWork,
  activeWorkspaceMap,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-w-0 flex-1 flex-col rounded-lg border border-border bg-muted/30 p-4 transition-colors',
        isOver && 'bg-accent/50'
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{status}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onStartWork={onStartWork}
            agentName={task.agentId ? agentMap.get(task.agentId) : undefined}
            projectName={task.projectId ? projectMap.get(task.projectId) : undefined}
            showProject={showProject}
            canStartWork={canStartWork}
            activeWorkspaceId={activeWorkspaceMap?.get(task.id)}
          />
        ))}
      </div>
    </div>
  );
}
