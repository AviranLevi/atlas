// React / library
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Hooks
import { useCreatePipeline } from '@/hooks/use-pipelines.hook';

// Types
import type { PipelineWithTasks } from '@atlas/shared';
import type { Task } from '@atlas/shared';

type TaskEntry = {
  taskId: string;
  taskName: string;
  autoReview: boolean;
  autoAccept: boolean;
};

type CreatePipelineDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  tasks: Task[];
  onCreated: (pipeline: PipelineWithTasks) => void;
};

export function CreatePipelineDialog({ open, onOpenChange, projectId, tasks, onCreated }: CreatePipelineDialogProps) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<TaskEntry[]>([]);
  const create = useCreatePipeline();

  const availableTasks = tasks.filter((t) => !selected.some((s) => s.taskId === t.id));

  const handleAddTask = (task: Task) => {
    setSelected((prev) => [...prev, { taskId: task.id, taskName: task.name, autoReview: false, autoAccept: false }]);
  };

  const handleRemove = (taskId: string) => {
    setSelected((prev) => prev.filter((s) => s.taskId !== taskId));
  };

  const handleMoveUp = (i: number) => {
    if (i === 0) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };

  const handleMoveDown = (i: number) => {
    setSelected((prev) => {
      if (i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const toggleField = (taskId: string, field: 'autoReview' | 'autoAccept') => {
    setSelected((prev) =>
      prev.map((s) => {
        if (s.taskId !== taskId) return s;
        if (field === 'autoAccept') {
          // autoAccept requires autoReview
          return { ...s, autoAccept: !s.autoAccept, autoReview: !s.autoAccept ? true : s.autoReview };
        }
        return { ...s, [field]: !s[field], autoAccept: field === 'autoReview' && s.autoReview ? false : s.autoAccept };
      }),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selected.length === 0) return;
    create.mutate(
      {
        projectId,
        name: name.trim(),
        tasks: selected.map((s) => ({
          taskId: s.taskId,
          autoReview: s.autoReview,
          autoAccept: s.autoAccept,
          baseStrategy: 'previous',
        })),
      },
      {
        onSuccess: (pipeline) => {
          onOpenChange(false);
          setName('');
          setSelected([]);
          onCreated(pipeline);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Pipeline</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pipeline-name">Name</Label>
            <Input
              id="pipeline-name"
              placeholder="e.g. Backend bootstrap"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tasks (in order)</Label>

            {selected.length > 0 && (
              <div className="flex flex-col gap-1 rounded-md border p-2">
                {selected.map((entry, i) => (
                  <div key={entry.taskId} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent/30">
                    <span className="w-5 shrink-0 text-xs text-muted-foreground text-right">{i + 1}.</span>
                    <span className="flex-1 min-w-0 truncate text-sm">{entry.taskName}</span>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={entry.autoReview}
                          onCheckedChange={() => toggleField(entry.taskId, 'autoReview')}
                          className="h-3.5 w-3.5"
                        />
                        Auto-review
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={entry.autoAccept}
                          onCheckedChange={() => toggleField(entry.taskId, 'autoAccept')}
                          disabled={!entry.autoReview}
                          className="h-3.5 w-3.5"
                        />
                        Auto-accept
                      </label>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveUp(i)}
                        disabled={i === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleMoveDown(i)}
                        disabled={i === selected.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(entry.taskId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {availableTasks.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-md border">
                {availableTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleAddTask(task)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{task.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">{task.status}</span>
                  </button>
                ))}
              </div>
            )}

            {availableTasks.length === 0 && selected.length === 0 && (
              <p className="text-sm text-muted-foreground">No tasks available in this project.</p>
            )}
          </div>

          {create.isError && <p className="text-sm text-destructive">{create.error.message}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !name.trim() || selected.length === 0}>
              {create.isPending ? 'Creating...' : 'Create Pipeline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
