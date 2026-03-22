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
import { usePhases } from '@/hooks/use-phases.hook';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks.hook';
import { ReviewPanel } from '@/components/reviews/ReviewPanel';
import type {
  CreateTask,
  UpdateTask,
  TaskPriority,
  TaskEstimate,
} from '@my-agents/shared';
import type { TaskDialogProps } from './kanban.types';
import { PRIORITIES, ESTIMATES, NONE_VALUE } from './kanban.constants';

function toOptionalId(value: string): string | null {
  return value === NONE_VALUE ? null : value;
}

export function TaskDialog({ open, onOpenChange, task, defaultProjectId, followUpContext }: TaskDialogProps) {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [estimate, setEstimate] = useState<TaskEstimate>('M');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [notes, setNotes] = useState('');
  const [agentId, setAgentId] = useState<string>(NONE_VALUE);
  const [skillId, setSkillId] = useState<string>(NONE_VALUE);
  const [projectId, setProjectId] = useState<string>(NONE_VALUE);
  const [tagsInput, setTagsInput] = useState('');
  const [phaseId, setPhaseId] = useState<string>(NONE_VALUE);

  const { data: agents = [] } = useAgents();
  const { data: skills = [] } = useSkills();
  const { data: projects = [] } = useProjects();
  const effectiveProjectId = projectId === NONE_VALUE ? '' : projectId;
  const { data: phases = [] } = usePhases(effectiveProjectId);
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
      setPhaseId(task.phaseId ?? NONE_VALUE);
      setTagsInput(task.tags?.join(', ') ?? '');
    } else {
      setName(followUpContext ? `Follow-up: ${followUpContext.originalTaskName}` : '');
      setPriority('Medium');
      setEstimate('M');
      setDefinitionOfDone('');
      setNotes(followUpContext ? `Follow-up from: ${followUpContext.originalTaskName}` : '');
      setAgentId(NONE_VALUE);
      setSkillId(NONE_VALUE);
      // Auto-select: explicit default > single project > none
      const autoProject = defaultProjectId ?? (projects.length === 1 ? projects[0].id : undefined);
      setProjectId(autoProject ?? NONE_VALUE);
      setPhaseId(NONE_VALUE);
      setTagsInput(followUpContext ? 'follow-up' : '');
    }
  }, [task, open, defaultProjectId, projects, followUpContext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || projectId === NONE_VALUE) return;

    const parsedTags = tagsInput.trim()
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : null;

    if (isEditing) {
      const updatePayload: UpdateTask = {
        name: name.trim(),
        priority,
        estimate,
        definitionOfDone: definitionOfDone.trim() || null,
        notes: notes.trim() || null,
        tags: parsedTags,
        agentId: toOptionalId(agentId),
        skillId: toOptionalId(skillId),
        projectId: toOptionalId(projectId),
        phaseId: toOptionalId(phaseId),
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
        tags: parsedTags,
        agentId: toOptionalId(agentId),
        skillId: toOptionalId(skillId),
        projectId: toOptionalId(projectId),
        phaseId: toOptionalId(phaseId),
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
          <DialogTitle>{isEditing ? 'Edit Task' : followUpContext ? 'Create Follow-up Task' : 'New Task'}</DialogTitle>
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
            <Label htmlFor="task-tags">Tags</Label>
            <Input
              id="task-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="bug, feature, refactor (comma-separated)"
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
            <Label>
              Project <span className="text-destructive">*</span>
            </Label>
            <Select value={projectId} onValueChange={(v) => { setProjectId(v); setPhaseId(NONE_VALUE); }}>
              <SelectTrigger className={projectId === NONE_VALUE ? 'border-destructive/50' : ''}>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {projectId === NONE_VALUE && (
              <p className="text-xs text-destructive">A project is required to run tasks</p>
            )}
          </div>
          {effectiveProjectId && phases.length > 0 && (
            <div className="space-y-2">
              <Label>Phase</Label>
              <Select value={phaseId} onValueChange={setPhaseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {phases.map((ph) => (
                    <SelectItem key={ph.id} value={ph.id}>
                      {ph.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {isEditing && task.status === 'In Review' && (
            <ReviewPanel taskId={task.id} />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} asChild>
              <button type="button">Cancel</button>
            </Button>
            <Button asChild>
              <button type="submit" disabled={isPending || !name.trim() || projectId === NONE_VALUE}>
                {isEditing ? 'Update' : 'Create'}
              </button>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
