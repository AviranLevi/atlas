// React / library
import { useCallback, useMemo } from 'react';
import { ReactFlow, Background, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Components
import { PipelineTaskNode } from './PipelineTaskNode';

// Hooks
import { useReorderPipelineTasks, useRemovePipelineTask } from '@/hooks/use-pipelines.hook';

// Constants
import { EDGE_STYLE, PIPELINE_FLOW } from '../pipelines.constants';

// Types
import type { PipelineTask, PipelineWithTasks, UpdatePipelineTask } from '@atlas/shared';
import type { PipelineTaskNodeData } from '../pipelines.types';

const nodeTypes = { pipelineTask: PipelineTaskNode };

interface PipelineFlowProps {
  pipeline: PipelineWithTasks;
  onUpdateTask: (taskId: string, data: UpdatePipelineTask) => void;
  onTaskClick: (taskId: string) => void;
  onNodeClick?: (taskId: string) => void;
}

/** Renders pipeline tasks as a vertical React Flow chain with animated edges. */
export function PipelineFlow({ pipeline, onUpdateTask, onTaskClick, onNodeClick }: PipelineFlowProps) {
  const isPipelineRunning = pipeline.status === 'running';
  const isPipelineIdle = pipeline.status === 'idle';
  const reorder = useReorderPipelineTasks();
  const removeTask = useRemovePipelineTask();

  const sorted = useMemo(() => pipeline.tasks.slice().sort((a, b) => a.position - b.position), [pipeline.tasks]);

  const handleMoveUp = useCallback(
    (idx: number) => {
      if (idx === 0) return;
      const newOrder = sorted.map((t) => t.taskId);
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
      reorder.mutate({ id: pipeline.id, data: { taskIds: newOrder } });
    },
    [sorted, pipeline.id, reorder],
  );

  const handleMoveDown = useCallback(
    (idx: number) => {
      if (idx >= sorted.length - 1) return;
      const newOrder = sorted.map((t) => t.taskId);
      [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
      reorder.mutate({ id: pipeline.id, data: { taskIds: newOrder } });
    },
    [sorted, pipeline.id, reorder],
  );

  const handleRemove = useCallback(
    (taskId: string) => {
      removeTask.mutate({ id: pipeline.id, taskId });
    },
    [pipeline.id, removeTask],
  );

  const { nodes, edges } = useMemo(() => {
    const nodes: Node<PipelineTaskNodeData>[] = sorted.map((task, idx) => ({
      id: task.taskId,
      type: 'pipelineTask',
      position: { x: PIPELINE_FLOW.xGap, y: PIPELINE_FLOW.paddingY + idx * PIPELINE_FLOW.yGap },
      data: {
        task,
        isCurrent: pipeline.currentTaskId === task.taskId,
        pipelineRunning: isPipelineRunning,
        pipelineIdle: isPipelineIdle,
        isFirst: idx === 0,
        isLast: idx === sorted.length - 1,
        onUpdateTask: (data: UpdatePipelineTask) => onUpdateTask(task.taskId, data),
        onMoveUp: () => handleMoveUp(idx),
        onMoveDown: () => handleMoveDown(idx),
        onRemove: () => handleRemove(task.taskId),
        onTaskClick: () => onTaskClick(task.taskId),
      },
      draggable: false,
      selectable: true,
      connectable: false,
    }));

    const edges: Edge[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i];
      const to = sorted[i + 1];
      const style = pickEdgeStyle(from, to);
      edges.push({
        id: `${from.taskId}->${to.taskId}`,
        source: from.taskId,
        target: to.taskId,
        type: 'smoothstep',
        animated: style.animated,
        style: { stroke: style.stroke, strokeWidth: style.width },
        markerEnd: { type: 'arrowclosed' as const, color: style.stroke },
      });
    }

    return { nodes, edges };
  }, [
    sorted,
    pipeline.currentTaskId,
    isPipelineRunning,
    isPipelineIdle,
    onUpdateTask,
    handleMoveUp,
    handleMoveDown,
    handleRemove,
    onTaskClick,
  ]);

  const canvasHeight = Math.max(
    PIPELINE_FLOW.canvasMinHeight,
    PIPELINE_FLOW.paddingY * 2 + pipeline.tasks.length * PIPELINE_FLOW.yGap,
  );

  if (pipeline.tasks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No tasks in this pipeline.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/20" style={{ height: canvasHeight }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick ? (_e, n) => onNodeClick(n.id) : undefined}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        panOnDrag
        zoomOnScroll
      >
        <Background color="hsl(var(--border))" gap={20} />
      </ReactFlow>
    </div>
  );
}

/** Picks edge color/animation based on the two endpoint task statuses. */
function pickEdgeStyle(from: PipelineTask, to: PipelineTask) {
  if (from.status === 'failed' || to.status === 'failed') return EDGE_STYLE.failed;
  if (from.status === 'completed' && to.status === 'running') return EDGE_STYLE.active;
  if (from.status === 'completed' && to.status === 'completed') return EDGE_STYLE.done;
  if (from.status === 'running') return EDGE_STYLE.active;
  return EDGE_STYLE.pending;
}
