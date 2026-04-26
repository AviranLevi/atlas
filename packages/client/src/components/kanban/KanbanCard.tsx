// React / library
import { TASK_STATUS } from '@atlas/shared';
import { useDraggable } from '@dnd-kit/core';

// Components
import { ReviewBadge } from '@/components/reviews/ReviewBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { KanbanCardActions } from './KanbanCardActions';
import { TaskSourceBadge } from './TaskSourceBadge';

// Hooks
import { useReview } from '@/hooks/use-reviews.hook';

// Lib
import { timeAgo } from '@/lib/format';
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';
import { cn } from '@/lib/utils';

// Types
import type { KanbanCardProps } from './kanban.types';

// Constants
import { priorityBadgeClass } from './kanban.constants';

export function KanbanCard({
  task,
  onEdit,
  onDelete,
  onStartWork,
  isOverlay,
  agentName,
  projectName,
  showProject = true,
  canStartWork = false,
  activeWorkspaceId,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  const { data: review } = useReview(task.status === TASK_STATUS.IN_REVIEW ? task.id : '');

  const metaRow = (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="outline" className={cn('text-xs', priorityBadgeClass[task.priority ?? 'Medium'])}>
        {task.priority}
      </Badge>
      <Badge variant="outline" className="text-xs">
        {task.estimate}
      </Badge>
    </div>
  );

  const extraContent = (
    <>
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      {task.definitionOfDone && (
        <p className="text-muted-foreground line-clamp-1 text-[11px]">{task.definitionOfDone}</p>
      )}
      <div className="text-muted-foreground flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          {agentName && (
            <span className="inline-flex items-center gap-1">
              <span className="bg-primary/10 inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-medium">
                {agentName.slice(0, 2).toUpperCase()}
              </span>
              <span className="max-w-[80px] truncate">{agentName}</span>
            </span>
          )}
          {showProject && projectName && <span className="max-w-[80px] truncate">{projectName}</span>}
          <TaskSourceBadge source={task.source ?? null} />
        </div>
        <span>{timeAgo(task.createdAt)}</span>
      </div>
    </>
  );

  if (isOverlay) {
    return (
      <Card className="cursor-grabbing shadow-lg ring-2 ring-primary/30">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
          <h4 className="font-medium leading-tight line-clamp-2">{task.name}</h4>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 px-4 pb-4 pt-0">{metaRow}</CardContent>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      data-tour={TOUR_TARGETS.kanbanTaskCard}
      role="button"
      tabIndex={0}
      onClick={() => onEdit(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(task);
        }
      }}
      className={cn('cursor-pointer transition-shadow hover:shadow-md', isDragging && 'opacity-30')}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
        <h4 className="font-medium leading-tight line-clamp-2">{task.name}</h4>
        <KanbanCardActions
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onStartWork={onStartWork}
          canStartWork={canStartWork}
          activeWorkspaceId={activeWorkspaceId}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-4 pb-4 pt-0">
        {metaRow}
        {review && <ReviewBadge status={review.status} />}
        {extraContent}
      </CardContent>
    </Card>
  );
}
