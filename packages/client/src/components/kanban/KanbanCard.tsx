import { useDraggable } from '@dnd-kit/core';
import { Pencil, Trash2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Task } from '@my-agents/shared';

type KanbanCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStartWork?: (task: Task) => void;
  isOverlay?: boolean;
  agentName?: string;
  projectName?: string;
  showProject?: boolean;
  canStartWork?: boolean;
};

const priorityBadgeClass: Record<string, string> = {
  High: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  Medium: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  Low: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

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
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({ id: task.id });

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
        {extraContent}
      </CardContent>
    </Card>
  );
}
