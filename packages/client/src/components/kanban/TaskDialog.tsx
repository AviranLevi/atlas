// React / library
import { TASK_STATUS } from '@atlas/shared';

// Components
import { ReviewPanel } from '@/components/reviews/ReviewPanel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TaskAdvancedFields } from './TaskAdvancedFields';
import { TaskCoreFields } from './TaskCoreFields';

// Hooks
import { useTaskForm } from './use-task-form.hook';

// Types
import type { TaskDialogProps } from './kanban.types';

// Constants
import { NONE_VALUE } from './kanban.constants';

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultProjectId,
  defaultStatus,
  followUpContext,
}: TaskDialogProps) {
  const form = useTaskForm({
    task,
    open,
    defaultProjectId,
    defaultStatus,
    followUpContext,
    onClose: () => onOpenChange(false),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {form.isEditing ? 'Edit Task' : followUpContext ? 'Create Follow-up Task' : 'New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="task-name">Name</Label>
            <Input
              id="task-name"
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
            <Label htmlFor="task-dod">
              Definition of Done
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                — what does success look like for the agent?
              </span>
            </Label>
            <Textarea
              id="task-dod"
              value={form.definitionOfDone}
              onChange={(e) => form.setDefinitionOfDone(e.target.value)}
              placeholder={
                'List acceptance criteria, one per line. Include the commands the agent should run to verify.\nExample:\n- All tests pass (npm test)\n- No TypeScript errors (npm run typecheck)\n- Feature works end-to-end in the browser'
              }
              rows={5}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-notes">
              Notes
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                — extra context, constraints, or background
              </span>
            </Label>
            <Textarea
              id="task-notes"
              value={form.notes}
              onChange={(e) => form.setNotes(e.target.value)}
              placeholder={
                'Relevant files, links, constraints, prior attempts, or edge cases.\nExample: src/components/Auth.tsx, src/hooks/use-auth.hook.ts'
              }
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

          {form.isEditing && task?.status === TASK_STATUS.IN_REVIEW && <ReviewPanel taskId={task.id} />}

          <div className="flex items-center justify-end gap-2 pt-1">
            {form.submitError ? (
              <p className="mr-auto text-sm text-destructive">{form.submitError.message}</p>
            ) : (
              (form.nameError || form.projectError) && (
                <p className="mr-auto text-sm text-destructive">
                  {form.nameError ? 'Task name is required' : 'Please select a project'}
                </p>
              )
            )}
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.isPending}>
              {form.isPending ? 'Saving…' : form.isEditing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
