import { useDraggable } from '@dnd-kit/core';
import { Pencil, Trash2 } from 'lucide-react';
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
  isOverlay?: boolean;
};

const priorityBadgeClass: Record<string, string> = {
  High: 'border-red-200 bg-red-50 text-red-700',
  Medium: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  Low: 'border-green-200 bg-green-50 text-green-700',
};

export function KanbanCard({ task, onEdit, onDelete, isOverlay }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({ id: task.id });

  if (isOverlay) {
    return (
      <Card className="cursor-grabbing shadow-lg ring-2 ring-primary/30">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
          <h4 className="font-medium leading-tight line-clamp-2">{task.name}</h4>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5 px-4 pb-4 pt-0">
          <Badge variant="outline" className={cn('text-xs', priorityBadgeClass[task.priority])}>
            {task.priority}
          </Badge>
          <Badge variant="outline" className="text-xs">{task.estimate}</Badge>
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
      <CardContent className="flex flex-wrap gap-1.5 px-4 pb-4 pt-0">
        <Badge
          variant="outline"
          className={cn('text-xs', priorityBadgeClass[task.priority])}
        >
          {task.priority}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {task.estimate}
        </Badge>
      </CardContent>
    </Card>
  );
}
