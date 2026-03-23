import { useState } from 'react';
import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { Task, TaskStatus } from '@my-agents/shared';

/**
 * Encapsulates drag-and-drop state and handlers for the kanban board.
 *
 * Only allows dragging tasks back to "To Do" (reset). Forward transitions
 * are controlled by explicit actions (StartWork, agent completion, review approval).
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

    if (newStatus !== 'To Do') return;

    onStatusChange(taskId, newStatus);
  }

  return { sensors, activeTask, handleDragStart, handleDragEnd };
}
