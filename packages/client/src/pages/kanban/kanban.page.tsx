// React / library
import { TASK_STATUS } from '@atlas/shared';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { GitBranch, LayoutGrid, Plus, X } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { EmptyState } from '@/components/empty-state/EmptyState';
import { BacklogList } from '@/components/kanban/BacklogList';
import { KanbanCard } from '@/components/kanban/KanbanCard';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { TaskDialog } from '@/components/kanban/TaskDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StartWorkDialog } from '@/components/workspaces/StartWorkDialog';
import { CreatePipelineDialog } from '@/pages/pipelines/components/CreatePipelineDialog';
import { KanbanFilterBar } from './components/KanbanFilterBar';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/use-tasks.hook';
import { useWorkspaces } from '@/hooks/use-workspaces.hook';
import { useKanbanDnd } from './use-kanban-dnd.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Lib
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

// Types
import type { Task, TaskStatus } from '@atlas/shared';

// Constants
import { COLUMNS } from './kanban.constants';

export function KanbanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>(TASK_STATUS.TODO);
  const [startWorkDialogOpen, setStartWorkDialogOpen] = useState(false);
  const [startWorkTask, setStartWorkTask] = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [createPipelineOpen, setCreatePipelineOpen] = useState(false);
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

  const { sensors, activeTask, handleDragStart, handleDragEnd } = useKanbanDnd(tasks, (taskId, newStatus) =>
    updateTask.mutate({ id: taskId, data: { status: newStatus } }),
  );

  const activeWorkspaceMap = useMemo(
    () =>
      new Map(
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

  const handleToggleSelect = useCallback((task: Task) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(task.id)) next.delete(task.id);
      else next.add(task.id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedTaskIds(new Set()), []);

  const selectedTasks = useMemo(() => tasks.filter((t) => selectedTaskIds.has(t.id)), [tasks, selectedTaskIds]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const backlogTasks = tasks.filter((t) => t.status === TASK_STATUS.BACKLOG);
  const hasFilter = !!agentFilter;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Manage and track tasks across your workflow</p>
        </div>
        <div className="flex items-center gap-2">
          {activeProjectId && (
            <Button variant="outline" size="sm" onClick={() => setCreatePipelineOpen(true)}>
              <GitBranch className="mr-1.5 h-4 w-4" />
              Create Pipeline
            </Button>
          )}
          <Button
            onClick={() => {
              setNewTaskStatus(TASK_STATUS.TODO);
              setDialogOpen(true);
            }}
            size="sm"
            data-tour={TOUR_TARGETS.kanbanAddTask}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {tasks.length === 0 && !hasFilter ? (
        <EmptyState
          icon={LayoutGrid}
          title="No tasks yet"
          body="Tasks track work across columns and can be picked up by agents. Add your first one to get going."
          primaryCta={{
            label: 'Create Task',
            icon: Plus,
            onClick: () => {
              setNewTaskStatus(TASK_STATUS.TODO);
              setDialogOpen(true);
            },
          }}
        />
      ) : (
        <Tabs defaultValue="board">
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="backlog" className="gap-1.5">
                Backlog
                {backlogTasks.length > 0 && (
                  <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
                    {backlogTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <KanbanFilterBar
              agents={agents}
              agentFilter={agentFilter}
              onAgentFilterChange={(v) => setFilter('agentId', v)}
              onClearFilters={() => setSearchParams({})}
            />
          </div>

          <TabsContent value="board" className="mt-4">
            {selectedTaskIds.size > 0 && (
              <div className="mb-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
                <span className="text-sm font-medium">
                  {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected
                </span>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  <X className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>
            )}
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-4" data-tour={TOUR_TARGETS.kanbanBoard}>
                {COLUMNS.map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    tasks={tasksByStatus[status] ?? []}
                    onEdit={(task) => {
                      setEditingTask(task);
                      setDialogOpen(true);
                    }}
                    onDelete={(id) => deleteTask.mutate(id)}
                    onStartWork={(task) => {
                      setStartWorkTask(task);
                      setStartWorkDialogOpen(true);
                    }}
                    agentMap={agentMap}
                    projectMap={projectMap}
                    showProject={!projectFilter}
                    canStartWork
                    activeWorkspaceMap={activeWorkspaceMap}
                    selectedTaskIds={selectedTaskIds}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
              </div>
              <DragOverlay dropAnimation={null}>
                {activeTask ? <KanbanCard task={activeTask} onEdit={() => {}} onDelete={() => {}} isOverlay /> : null}
              </DragOverlay>
            </DndContext>
          </TabsContent>

          <TabsContent value="backlog" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewTaskStatus(TASK_STATUS.BACKLOG);
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                New Backlog Item
              </Button>
            </div>
            <BacklogList
              tasks={backlogTasks}
              agentMap={agentMap}
              projectMap={projectMap}
              showProject={!projectFilter}
              onEdit={(task) => {
                setEditingTask(task);
                setDialogOpen(true);
              }}
              onDelete={(id) => deleteTask.mutate(id)}
              onPromote={(id) => updateTask.mutate({ id, data: { status: TASK_STATUS.TODO } })}
            />
          </TabsContent>
        </Tabs>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingTask(null);
            setNewTaskStatus(TASK_STATUS.TODO);
          }
        }}
        task={editingTask}
        defaultProjectId={projectFilter}
        defaultStatus={newTaskStatus}
      />

      <StartWorkDialog
        open={startWorkDialogOpen}
        onOpenChange={(open) => {
          setStartWorkDialogOpen(open);
          if (!open) setStartWorkTask(null);
        }}
        task={startWorkTask}
        agentName={startWorkTask?.agentId ? agentMap.get(startWorkTask.agentId) : undefined}
        projectName={startWorkTask?.projectId ? projectMap.get(startWorkTask.projectId) : undefined}
        projectId={startWorkTask?.projectId ?? undefined}
      />

      {activeProjectId && (
        <CreatePipelineDialog
          open={createPipelineOpen}
          onOpenChange={(open) => {
            setCreatePipelineOpen(open);
            if (!open) clearSelection();
          }}
          projectId={activeProjectId}
          tasks={tasks}
          initialTasks={selectedTasks.map((t) => ({ taskId: t.id, taskName: t.name }))}
          onCreated={(pipeline) => {
            setCreatePipelineOpen(false);
            clearSelection();
            navigate(`/pipelines/${pipeline.id}`);
          }}
        />
      )}
    </div>
  );
}
