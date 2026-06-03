// React / library
import { TASK_STATUS } from '@atlas/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { usePhases } from '@/hooks/use-phases.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks.hook';

// Types
import type { CreateTask, TaskEstimate, TaskPriority, TaskStatus, UpdateTask } from '@atlas/shared';
import type { TaskDialogProps } from './kanban.types';

// Constants
import { NONE_VALUE } from './kanban.constants';

type UseTaskFormParams = Pick<
  TaskDialogProps,
  'task' | 'open' | 'defaultProjectId' | 'defaultStatus' | 'followUpContext'
> & {
  onClose: () => void;
};

export function useTaskForm({
  task,
  open: _open,
  defaultProjectId,
  defaultStatus,
  followUpContext,
  onClose,
}: UseTaskFormParams) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<TaskStatus>(TASK_STATUS.TODO);
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [estimate, setEstimate] = useState<TaskEstimate>('M');
  const [definitionOfDone, setDefinitionOfDone] = useState('');
  const [notes, setNotes] = useState('');
  const [agentId, setAgentId] = useState<string>(NONE_VALUE);
  const [projectId, setProjectId] = useState<string>(NONE_VALUE);
  const [tagsInput, setTagsInput] = useState('');
  const [phaseId, setPhaseId] = useState<string>(NONE_VALUE);

  const { data: agents = [] } = useAgents();
  const { data: projects = [] } = useProjects();
  const effectiveProjectId = projectId === NONE_VALUE ? '' : projectId;
  const { data: phases = [] } = usePhases(effectiveProjectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const isEditing = !!task;

  // Tracks which subject the form was last initialized for. Initializing the
  // form is a RESET — it must only happen when the form's subject genuinely
  // changes (a different task, or new ↔ edit), NOT on every background refetch
  // of `task`/`projects`. Keying the reset on identity prevents a refetch from
  // wiping the user's in-progress edits (which previously sent stale values on
  // submit, making updates appear to "not persist").
  const initializedKey = useRef<string | null>(null);

  useEffect(() => {
    const key = task ? `edit:${task.id}` : 'new';
    if (initializedKey.current === key) return;
    initializedKey.current = key;

    if (task) {
      setName(task.name);
      setStatus(task.status);
      setPriority(task.priority ?? 'Medium');
      setEstimate(task.estimate ?? 'M');
      setDefinitionOfDone(task.definitionOfDone ?? '');
      setNotes(task.notes ?? '');
      setAgentId(task.agentId ?? NONE_VALUE);
      setProjectId(task.projectId ?? NONE_VALUE);
      setPhaseId(task.phaseId ?? NONE_VALUE);
      setTagsInput(task.tags?.join(', ') ?? '');
    } else {
      setName(followUpContext ? `Follow-up: ${followUpContext.originalTaskName}` : '');
      setStatus(defaultStatus ?? TASK_STATUS.TODO);
      setPriority('Medium');
      setEstimate('M');
      setDefinitionOfDone('');
      setNotes(
        followUpContext
          ? followUpContext.reviewNotes?.trim()
            ? `Follow-up from: ${followUpContext.originalTaskName}\n\nReviewer notes:\n${followUpContext.reviewNotes}`
            : `Follow-up from: ${followUpContext.originalTaskName}`
          : '',
      );
      setAgentId(NONE_VALUE);
      const autoProject = defaultProjectId ?? (projects.length === 1 ? projects[0].id : undefined);
      setProjectId(autoProject ?? NONE_VALUE);
      setPhaseId(NONE_VALUE);
      setTagsInput(followUpContext ? 'follow-up' : '');
    }
  }, [task, defaultProjectId, defaultStatus, projects, followUpContext]);

  // New-task only: auto-select the project once the projects list loads (if the
  // user hasn't already picked one). Kept separate from the reset effect so it
  // doesn't clobber edits on refetch.
  useEffect(() => {
    if (task || defaultProjectId) return;
    if (projectId !== NONE_VALUE) return;
    if (projects.length === 1) setProjectId(projects[0].id);
  }, [task, defaultProjectId, projectId, projects]);

  const handleProjectChange = useCallback((id: string) => {
    setProjectId(id);
    setPhaseId(NONE_VALUE);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || projectId === NONE_VALUE) return;

      const parsedTags = tagsInput.trim()
        ? tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : null;

      const base = {
        name: name.trim(),
        status,
        priority,
        estimate,
        definitionOfDone: definitionOfDone.trim() || null,
        notes: notes.trim() || null,
        tags: parsedTags,
        agentId: agentId === NONE_VALUE ? null : agentId,
        projectId: projectId === NONE_VALUE ? null : projectId,
        phaseId: phaseId === NONE_VALUE ? null : phaseId,
      };

      const onSuccess = () => onClose();

      if (isEditing && task) {
        updateTask.mutate({ id: task.id, data: base satisfies UpdateTask }, { onSuccess });
      } else {
        createTask.mutate(base satisfies CreateTask, { onSuccess });
      }
    },
    [
      name,
      status,
      priority,
      estimate,
      definitionOfDone,
      notes,
      agentId,
      projectId,
      phaseId,
      tagsInput,
      isEditing,
      task,
      createTask,
      updateTask,
      onClose,
    ],
  );

  const isPending = createTask.isPending || updateTask.isPending;
  const submitMutation = isEditing ? updateTask : createTask;

  return {
    name,
    setName,
    status,
    setStatus,
    priority,
    setPriority,
    estimate,
    setEstimate,
    definitionOfDone,
    setDefinitionOfDone,
    notes,
    setNotes,
    agentId,
    setAgentId,
    projectId,
    handleProjectChange,
    tagsInput,
    setTagsInput,
    phaseId,
    setPhaseId,
    agents,
    projects,
    phases,
    isEditing,
    isPending,
    submitError: submitMutation.isError ? (submitMutation.error as Error) : null,
    canSubmit: !!name.trim() && projectId !== NONE_VALUE,
    handleSubmit,
  };
}
