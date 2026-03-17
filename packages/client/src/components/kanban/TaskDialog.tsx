import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgents } from '@/hooks/use-agents.hook';
import { useSkills } from '@/hooks/use-skills.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks.hook';
import type {
  Task,
  CreateTask,
  UpdateTask,
  TaskPriority,
  TaskEstimate,
} from '@my-agents/shared';

type TaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
};

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
const ESTIMATES: TaskEstimate[] = ['S', 'M', 'L'];

const NONE_VALUE = '__none__';

function toOptionalId(value: string): string | null {
  return value === NONE_VALUE ? null : value;
}

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [estimate, setEstimate] = useState<TaskEstimate>('M');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [notes, setNotes] = useState('');
  const [agentId, setAgentId] = useState<string>(NONE_VALUE);
  const [skillId, setSkillId] = useState<string>(NONE_VALUE);
  const [projectId, setProjectId] = useState<string>(NONE_VALUE);

  const { data: agents = [] } = useAgents();
  const { data: skills = [] } = useSkills();
  const { data: projects = [] } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setName(task.name);
      setPriority(task.priority);
      setEstimate(task.estimate);
      setDefinitionOfDone(task.definitionOfDone ?? '');
      setNotes(task.notes ?? '');
      setAgentId(task.agentId ?? NONE_VALUE);
      setSkillId(task.skillId ?? NONE_VALUE);
      setProjectId(task.projectId ?? NONE_VALUE);
    } else {
      setName('');
      setPriority('Medium');
      setEstimate('M');
      setDefinitionOfDone('');
      setNotes('');
      setAgentId(NONE_VALUE);
      setSkillId(NONE_VALUE);
      setProjectId(NONE_VALUE);
    }
  }, [task, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing) {
      const updatePayload: UpdateTask = {
        name: name.trim(),
        priority,
        estimate,
        definitionOfDone: definitionOfDone.trim() || null,
        notes: notes.trim() || null,
        agentId: toOptionalId(agentId),
        skillId: toOptionalId(skillId),
        projectId: toOptionalId(projectId),
      };
      updateTask.mutate(
        { id: task.id, data: updatePayload },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    } else {
      const createPayload: CreateTask = {
        name: name.trim(),
        status: 'To Do',
        priority,
        estimate,
        definitionOfDone: definitionOfDone.trim() || null,
        notes: notes.trim() || null,
        agentId: toOptionalId(agentId),
        skillId: toOptionalId(skillId),
        projectId: toOptionalId(projectId),
      };
      createTask.mutate(createPayload, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="task-name">Name</Label>
            <Input
              id="task-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Task name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estimate</Label>
              <Select
                value={estimate}
                onValueChange={(v) => setEstimate(v as TaskEstimate)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estimate" />
                </SelectTrigger>
                <SelectContent>
                  {ESTIMATES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-dod">Definition of Done</Label>
            <Textarea
              id="task-dod"
              value={definitionOfDone}
              onChange={(e) => setDefinitionOfDone(e.target.value)}
              placeholder="Criteria for completion"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Skill</Label>
            <Select value={skillId} onValueChange={setSkillId}>
              <SelectTrigger>
                <SelectValue placeholder="Select skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {skills.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} asChild>
              <button type="button">Cancel</button>
            </Button>
            <Button asChild>
              <button type="submit" disabled={isPending}>
                {isEditing ? 'Update' : 'Create'}
              </button>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
