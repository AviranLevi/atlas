// React / library
import { TASK_STATUS } from '@atlas/shared';
import { Bot, ExternalLink, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import { ReviewPanel } from '@/components/reviews/ReviewPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { TaskAdvancedFields } from '@/components/kanban/TaskAdvancedFields';
import { TaskCoreFields } from '@/components/kanban/TaskCoreFields';

// Hooks
import { useTask } from '@/hooks/use-tasks.hook';
import { useTaskForm } from '@/components/kanban/use-task-form.hook';
import { useWorkspaces } from '@/hooks/use-workspaces.hook';

// Lib
import { timeAgo } from '@/lib/format';

// Constants
import { NONE_VALUE } from '@/components/kanban/kanban.constants';

// Types
import type { Task } from '@atlas/shared';

interface TaskDetailSheetProps {
  taskId: string | null;
  onClose: () => void;
}

/** Right-side slide-over panel showing full task detail with inline editing. */
export function TaskDetailSheet({ taskId, onClose }: TaskDetailSheetProps) {
  const { data: task, isLoading } = useTask(taskId ?? undefined);

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && !task && taskId && (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <p className="text-sm text-muted-foreground">Task not found</p>
          </div>
        )}
        {task && <TaskDetailContent task={task} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function TaskDetailContent({ task, onClose }: { task: Task; onClose: () => void }) {
  const form = useTaskForm({ task, open: true, onClose });
  const { data: workspaces = [] } = useWorkspaces();
  const taskWorkspaces = workspaces.filter((w) => w.taskId === task.id);
  const activeWorkspace = taskWorkspaces.find(
    (w) => w.status === 'running' || w.status === 'pending' || w.status === 'completed',
  );

  return (
    <>
      <SheetHeader className="pr-10">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="shrink-0 text-xs">
            {task.status}
          </Badge>
          {task.source && (
            <Badge variant="secondary" className="text-[10px]">
              {task.source}
            </Badge>
          )}
        </div>
        <SheetTitle className="text-xl leading-tight">{task.name}</SheetTitle>
        <p className="text-xs text-muted-foreground">
          Created {timeAgo(task.createdAt)} · Updated {timeAgo(task.updatedAt)}
        </p>
      </SheetHeader>

      <form onSubmit={form.handleSubmit} className="flex flex-col gap-5 px-6 pb-6">
        {/* Active workspace banner */}
        {activeWorkspace && (
          <Link
            to={`/workspaces/${activeWorkspace.id}`}
            className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 hover:bg-blue-100 transition-colors dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200 dark:hover:bg-blue-950/70"
          >
            <Bot className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">Active workspace · {activeWorkspace.agentRuntime}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </Link>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="sheet-task-name">Name</Label>
          <Input
            id="sheet-task-name"
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            placeholder="What needs to be done?"
            className="text-base"
            required
          />
        </div>

        <TaskCoreFields
          projectId={form.projectId}
          onProjectChange={form.handleProjectChange}
          agentId={form.agentId}
          onAgentChange={form.setAgentId}
          status={form.status}
          onStatusChange={form.setStatus}
          priority={form.priority}
          onPriorityChange={form.setPriority}
          estimate={form.estimate}
          onEstimateChange={form.setEstimate}
          projects={form.projects}
          agents={form.agents}
          projectError={form.projectError}
        />

        <div className="space-y-1.5">
          <Label htmlFor="sheet-task-dod">
            Definition of Done
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">— what does success look like?</span>
          </Label>
          <Textarea
            id="sheet-task-dod"
            value={form.definitionOfDone}
            onChange={(e) => form.setDefinitionOfDone(e.target.value)}
            placeholder="Acceptance criteria, one per line..."
            rows={4}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sheet-task-notes">
            Notes
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">— extra context or constraints</span>
          </Label>
          <Textarea
            id="sheet-task-notes"
            value={form.notes}
            onChange={(e) => form.setNotes(e.target.value)}
            placeholder="Relevant files, links, prior attempts..."
            rows={3}
          />
        </div>

        <TaskAdvancedFields
          tagsInput={form.tagsInput}
          onTagsChange={form.setTagsInput}
          phaseId={form.phaseId}
          onPhaseChange={form.setPhaseId}
          phases={form.phases}
          noneValue={NONE_VALUE}
        />

        {task.status === TASK_STATUS.IN_REVIEW && <ReviewPanel taskId={task.id} />}

        {/* Workspace history */}
        {taskWorkspaces.length > 0 && (
          <div className="space-y-2">
            <Label>Workspaces</Label>
            <div className="flex flex-col gap-1.5">
              {taskWorkspaces.map((ws) => (
                <Link
                  key={ws.id}
                  to={`/workspaces/${ws.id}`}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {ws.status}
                    </Badge>
                    <span className="truncate text-muted-foreground">{ws.agentRuntime}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{timeAgo(ws.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1 sticky bottom-0 bg-background pb-2">
          {form.submitError ? (
            <p className="mr-auto text-sm text-destructive">{form.submitError.message}</p>
          ) : (
            (form.nameError || form.projectError) && (
              <p className="mr-auto text-sm text-destructive">
                {form.nameError ? 'Task name is required' : 'Please select a project'}
              </p>
            )
          )}
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.isPending}>
            {form.isPending ? 'Saving…' : 'Update'}
          </Button>
        </div>
      </form>
    </>
  );
}
