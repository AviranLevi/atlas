// React / library
import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Plus, X } from 'lucide-react';
// Components
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { KanbanCard } from '@/components/kanban/KanbanCard';
import { TaskDialog } from '@/components/kanban/TaskDialog';
// Hooks
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/use-tasks.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useAgents } from '@/hooks/use-agents.hook';
// Types
import type { Task, TaskStatus } from '@my-agents/shared';

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];

export function KanbanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const projectFilter = searchParams.get('projectId') ?? undefined;
  const agentFilter = searchParams.get('agentId') ?? undefined;

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const filters = useMemo(() => {
    const f: { projectId?: string; agentId?: string } = {};
    if (projectFilter) f.projectId = projectFilter;
    if (agentFilter) f.agentId = agentFilter;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [projectFilter, agentFilter]);

  const { data: tasks = [], isLoading } = useTasks(filters);
  const { data: projects = [] } = useProjects();
  const { data: agents = [] } = useAgents();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      updateTask.mutate({ id: taskId, data: { status: newStatus } });
    }
    setActiveTask(null);
  }

  function handleEdit(task: Task) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  function handleDelete(id: string) {
    deleteTask.mutate(id);
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditingTask(null);
  }

  const tasksByStatus = COLUMNS.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  const hasFilters = projectFilter || agentFilter;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Drag and drop tasks between status columns
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={projectFilter ?? '__all__'}
          onValueChange={(v) => setFilter('projectId', v === '__all__' ? undefined : v)}
        >
          <SelectTrigger className="h-8 w-[200px] text-xs">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={agentFilter ?? '__all__'}
          onValueChange={(v) => setFilter('agentId', v === '__all__' ? undefined : v)}
        >
          <SelectTrigger className="h-8 w-[200px] text-xs">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setSearchParams({})}
          >
            <X className="mr-1 h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status] ?? []}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <KanbanCard task={activeTask} onEdit={() => {}} onDelete={() => {}} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        task={editingTask}
      />
    </div>
  );
}
