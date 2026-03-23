// React / library
import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { KanbanCard } from '@/components/kanban/KanbanCard';
import { TaskDialog } from '@/components/kanban/TaskDialog';
import { StartWorkDialog } from '@/components/workspaces/StartWorkDialog';
import { KanbanFilterBar } from './KanbanFilterBar';

// Hooks
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/use-tasks.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useAgents } from '@/hooks/use-agents.hook';
import { useWorkspaces } from '@/hooks/use-workspaces.hook';
import { useActiveProject } from '@/contexts/ProjectContext';
import { useKanbanDnd } from './use-kanban-dnd.hook';

// Types
import type { Task, TaskStatus } from '@my-agents/shared';

// Constants
import { COLUMNS } from './kanban-page.constants';

export function KanbanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [startWorkDialogOpen, setStartWorkDialogOpen] = useState(false);
  const [startWorkTask, setStartWorkTask] = useState<Task | null>(null);
  const { activeProjectId } = useActiveProject();

  const projectFilter = activeProjectId ?? undefined;
  const agentFilter = searchParams.get('agentId') ?? undefined;

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      });
    },
    [setSearchParams],
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
  const { data: workspaces = [] } = useWorkspaces();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const { sensors, activeTask, handleDragStart, handleDragEnd } = useKanbanDnd(
    tasks,
    (taskId, newStatus) => updateTask.mutate({ id: taskId, data: { status: newStatus } }),
  );

  const activeWorkspaceMap = useMemo(
    () => new Map(
      workspaces
        .filter((w) => w.status === 'running' || w.status === 'pending' || w.status === 'completed')
        .map((w) => [w.taskId, w.id]),
    ),
    [workspaces],
  );

  const agentMap = useMemo(() => new Map(agents.map((a) => [a.id, a.name])), [agents]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const tasksByStatus = COLUMNS.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>,
  );

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

      <KanbanFilterBar
        agents={agents}
        agentFilter={agentFilter}
        onAgentFilterChange={(v) => setFilter('agentId', v)}
        onClearFilters={() => setSearchParams({})}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status] ?? []}
              onEdit={(task) => { setEditingTask(task); setDialogOpen(true); }}
              onDelete={(id) => deleteTask.mutate(id)}
              onStartWork={(task) => { setStartWorkTask(task); setStartWorkDialogOpen(true); }}
              agentMap={agentMap}
              projectMap={projectMap}
              showProject={!projectFilter}
              canStartWork
              activeWorkspaceMap={activeWorkspaceMap}
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
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingTask(null); }}
        task={editingTask}
        defaultProjectId={projectFilter}
      />

      <StartWorkDialog
        open={startWorkDialogOpen}
        onOpenChange={(open) => { setStartWorkDialogOpen(open); if (!open) setStartWorkTask(null); }}
        task={startWorkTask}
        agentName={startWorkTask?.agentId ? agentMap.get(startWorkTask.agentId) : undefined}
        projectName={startWorkTask?.projectId ? projectMap.get(startWorkTask.projectId) : undefined}
        projectId={startWorkTask?.projectId ?? undefined}
      />
    </div>
  );
}
