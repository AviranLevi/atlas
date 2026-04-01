// React / library
import { ArrowRight, Pencil, Trash2 } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Lib
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

// Types
import type { BacklogListProps } from './kanban.types';

// Constants
import { priorityBadgeClass } from './kanban.constants';

export function BacklogList({
  tasks,
  agentMap,
  projectMap,
  showProject,
  onEdit,
  onDelete,
  onPromote,
}: BacklogListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-muted-foreground">No backlog items</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Create a task with status "Backlog" to stage it here before pulling it into To Do.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
          {/* Name + meta */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-sm font-medium">{task.name}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {task.priority && (
                <Badge variant="outline" className={cn('text-xs', priorityBadgeClass[task.priority])}>
                  {task.priority}
                </Badge>
              )}
              {task.estimate && (
                <Badge variant="outline" className="text-xs">
                  {task.estimate}
                </Badge>
              )}
              {task.tags?.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
              {task.agentId && agentMap.get(task.agentId) && (
                <span className="text-[11px] text-muted-foreground">{agentMap.get(task.agentId)}</span>
              )}
              {showProject && task.projectId && projectMap.get(task.projectId) && (
                <span className="text-[11px] text-muted-foreground">{projectMap.get(task.projectId)}</span>
              )}
              <span className="text-[11px] text-muted-foreground/60">{timeAgo(task.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => onPromote(task.id)}>
              To Do
              <ArrowRight className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
