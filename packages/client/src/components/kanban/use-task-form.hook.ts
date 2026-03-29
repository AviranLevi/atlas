import { useState, useEffect, useCallback } from 'react';
import { TASK_STATUS } from '@atlas/shared';
import type { TaskStatus, TaskPriority, TaskEstimate, CreateTask, UpdateTask } from '@atlas/shared';
import { useAgents } from '@/hooks/use-agents.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { usePhases } from '@/hooks/use-phases.hook';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks.hook';
import type { TaskDialogProps } from './kanban.types';
import { NONE_VALUE } from './kanban.constants';

type UseTaskFormParams = Pick<TaskDialogProps, 'task' | 'open' | 'defaultProjectId' | 'defaultStatus' | 'followUpContext'> & {
  onClose: () => void;
};

export function useTaskForm({ task, open, defaultProjectId, defaultStatus, followUpContext, onClose }: UseTaskFormParams) {
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

  useEffect(() => {
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
      setNotes(followUpContext ? `Follow-up from: ${followUpContext.originalTaskName}` : '');
      setAgentId(NONE_VALUE);
      const autoProject = defaultProjectId ?? (projects.length === 1 ? projects[0].id : undefined);
      setProjectId(autoProject ?? NONE_VALUE);
      setPhaseId(NONE_VALUE);
      setTagsInput(followUpContext ? 'follow-up' : '');
    }
  }, [task, open, defaultProjectId, defaultStatus, projects, followUpContext]);

  const handleProjectChange = useCallback((id: string) => {
    setProjectId(id);
    setPhaseId(NONE_VALUE);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || projectId === NONE_VALUE) return;

    const parsedTags = tagsInput.trim()
      ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
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
  }, [name, status, priority, estimate, definitionOfDone, notes, agentId, projectId, phaseId, tagsInput, isEditing, task, createTask, updateTask, onClose]);

  const isPending = createTask.isPending || updateTask.isPending;
  const submitMutation = isEditing ? updateTask : createTask;

  return {
    name, setName,
    status, setStatus,
    priority, setPriority,
    estimate, setEstimate,
    definitionOfDone, setDefinitionOfDone,
    notes, setNotes,
    agentId, setAgentId,
    projectId, handleProjectChange,
    tagsInput, setTagsInput,
    phaseId, setPhaseId,
    agents, projects, phases,
    isEditing, isPending,
    submitError: submitMutation.isError ? (submitMutation.error as Error) : null,
    canSubmit: !!name.trim() && projectId !== NONE_VALUE,
    handleSubmit,
  };
}
