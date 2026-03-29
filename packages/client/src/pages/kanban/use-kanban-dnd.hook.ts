import { useState } from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { TASK_STATUS } from '@atlas/shared';
import type { Task, TaskStatus } from '@atlas/shared';

const MANUAL_DROP_TARGETS = new Set<TaskStatus>([
  TASK_STATUS.BACKLOG,
  TASK_STATUS.TODO,
  TASK_STATUS.BLOCKED,
]);

/**
 * Encapsulates drag-and-drop state and handlers for the kanban board.
 *
 * Allows dragging to Backlog (staging), To Do (ready), and Blocked.
 * Forward transitions (In Progress → In Review → Done) are controlled by
 * explicit agent actions so they are not drag-droppable.
 */
export function useKanbanDnd(
  tasks: Task[],
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void,
) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    if (!MANUAL_DROP_TARGETS.has(newStatus)) return;

    onStatusChange(taskId, newStatus);
  }

  return { sensors, activeTask, handleDragStart, handleDragEnd };
}
