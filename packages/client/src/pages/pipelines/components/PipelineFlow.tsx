// React / library
import { useMemo } from 'react';
import { ReactFlow, Background, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Components
import { PipelineTaskNode } from './PipelineTaskNode';

// Constants
import { EDGE_STYLE, PIPELINE_FLOW } from '../pipelines.constants';

// Types
import type { PipelineTask, PipelineWithTasks, UpdatePipelineTask } from '@atlas/shared';
import type { PipelineTaskNodeData } from '../pipelines.types';

const nodeTypes = { pipelineTask: PipelineTaskNode };

interface PipelineFlowProps {
  pipeline: PipelineWithTasks;
  onUpdateTask: (taskId: string, data: UpdatePipelineTask) => void;
  onNodeClick?: (taskId: string) => void;
}

/** Renders pipeline tasks as a vertical React Flow chain with animated edges. */
export function PipelineFlow({ pipeline, onUpdateTask, onNodeClick }: PipelineFlowProps) {
  const isPipelineRunning = pipeline.status === 'running';

  const { nodes, edges } = useMemo(() => {
    const sorted = pipeline.tasks.slice().sort((a, b) => a.position - b.position);

    const nodes: Node<PipelineTaskNodeData>[] = sorted.map((task, idx) => ({
      id: task.taskId,
      type: 'pipelineTask',
      position: { x: PIPELINE_FLOW.xGap, y: PIPELINE_FLOW.paddingY + idx * PIPELINE_FLOW.yGap },
      data: {
        task,
        isCurrent: pipeline.currentTaskId === task.taskId,
        pipelineRunning: isPipelineRunning,
        onUpdateTask: (data: UpdatePipelineTask) => onUpdateTask(task.taskId, data),
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
  }, [pipeline.tasks, pipeline.currentTaskId, isPipelineRunning, onUpdateTask]);

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
