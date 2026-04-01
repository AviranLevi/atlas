// React / library
import { TASK_STATUS } from '@atlas/shared';
import { FileCode, Pencil, Play, Terminal, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Types
import type { KanbanCardActionsProps } from './kanban.types';

export function KanbanCardActions({
  task,
  onEdit,
  onDelete,
  onStartWork,
  canStartWork = false,
  activeWorkspaceId,
}: KanbanCardActionsProps) {
  return (
    <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
      {activeWorkspaceId && task.status !== TASK_STATUS.IN_REVIEW && (
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
      {activeWorkspaceId && task.status === TASK_STATUS.IN_REVIEW && (
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
      {canStartWork && task.status === TASK_STATUS.TODO && onStartWork && (
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
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)} aria-label="Edit task">
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
  );
}
