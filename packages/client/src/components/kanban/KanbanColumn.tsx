// React / library
import { useDroppable } from '@dnd-kit/core';

// Components
import { Badge } from '@/components/ui/badge';
import { KanbanCard } from './KanbanCard';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { KanbanColumnProps } from './kanban.types';

// Constants
import { COLUMN_STYLES, DEFAULT_COLUMN_STYLE } from './kanban.constants';

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
  selectedTaskIds,
  onToggleSelect,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  const { column: columnStyle, heading: headingStyle } = COLUMN_STYLES[status] ?? DEFAULT_COLUMN_STYLE;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-[280px] shrink-0 flex-col rounded-lg border p-4 transition-colors lg:w-auto lg:flex-1',
        columnStyle,
        isOver && 'bg-accent/50',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className={cn('font-semibold', headingStyle)}>{status}</h3>
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
            isSelected={selectedTaskIds?.has(task.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
