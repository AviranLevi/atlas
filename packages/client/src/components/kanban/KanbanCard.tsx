import { useDraggable } from '@dnd-kit/core';
import { Pencil, Trash2, Play, Terminal, FileCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ReviewBadge } from '@/components/reviews/ReviewBadge';
import { useReview } from '@/hooks/use-reviews.hook';
import { timeAgo } from '@/lib/format';
import type { KanbanCardProps } from './kanban.types';
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
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({ id: task.id });

  const { data: review } = useReview(task.status === 'In Review' ? task.id : '');

  const metaRow = (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="outline" className={cn('text-xs', priorityBadgeClass[task.priority])}>
        {task.priority}
      </Badge>
      <Badge variant="outline" className="text-xs">{task.estimate}</Badge>
    </div>
  );

  const extraContent = (
    <>
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
          ))}
        </div>
      )}
      {task.definitionOfDone && (
        <p className="text-muted-foreground line-clamp-1 text-[11px]">
          {task.definitionOfDone}
        </p>
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
          {showProject && projectName && (
            <span className="max-w-[80px] truncate">{projectName}</span>
          )}
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
        <CardContent className="flex flex-col gap-1.5 px-4 pb-4 pt-0">
          {metaRow}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
        isDragging && 'opacity-30'
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
        <h4 className="font-medium leading-tight line-clamp-2">{task.name}</h4>
        <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
          {activeWorkspaceId && task.status !== 'In Review' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-blue-500 hover:text-blue-600 dark:text-blue-400 animate-pulse"
                  aria-label="View active workspace"
                  asChild
                >
                  <Link to={`/workspaces/${activeWorkspaceId}`}>
                    <Terminal className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Agent running — view workspace</TooltipContent>
            </Tooltip>
          )}
          {activeWorkspaceId && task.status === 'In Review' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-green-600 hover:text-green-700 dark:text-green-400"
                  aria-label="Review changes"
                  asChild
                >
                  <Link to={`/workspaces/${activeWorkspaceId}`}>
                    <FileCode className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Review changes</TooltipContent>
            </Tooltip>
          )}
          {canStartWork && task.status === 'To Do' && onStartWork && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                  onClick={() => onStartWork(task)}
                  aria-label="Start work"
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start Agent Work</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(task)}
                aria-label="Edit task"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(task.id)}
                aria-label="Delete task"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-4 pb-4 pt-0">
        {metaRow}
        {review && <ReviewBadge status={review.status} />}
        {extraContent}
      </CardContent>
    </Card>
  );
}
