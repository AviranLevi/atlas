// React / library
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ArrowDown, ArrowUp, Bot, Cpu, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// Lib
import { cn } from '@/lib/utils';

// Constants
import { NODE_STATUS_STYLE, TASK_STATUS_META, WORKFLOW_STAGE_META } from '../pipelines.constants';

// Types
import type { PipelineTaskNodeData } from '../pipelines.types';

interface PipelineTaskNodeProps extends NodeProps {
  data: PipelineTaskNodeData;
}

/** Custom React Flow node for one pipeline task. */
export function PipelineTaskNode({ data }: PipelineTaskNodeProps) {
  const status = data.task.status;
  const style = NODE_STATUS_STYLE[status];
  const meta = TASK_STATUS_META[status];
  const stageMeta = data.task.workspaceStage ? WORKFLOW_STAGE_META[data.task.workspaceStage] : null;
  const StageIcon = stageMeta?.icon;

  const isCurrent = data.isCurrent;
  const isRunning = data.pipelineRunning;
  const isIdle = data.pipelineIdle;
  const isQueued = status === 'queued';

  return (
    <div
      className={cn(
        'rounded-lg border-2 px-3 py-2.5 shadow-sm transition-colors',
        style.border,
        style.bg,
        isCurrent && style.ring,
      )}
      style={{ width: 320 }}
    >
      {/* Top handle: connects to previous task */}
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !border-0 !bg-muted-foreground/40" />

      {/* Header row: position number + task name + status badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 w-5 text-right text-[10px] font-mono text-muted-foreground">
            {data.task.position + 1}.
          </span>
          <Link
            to={`/tasks/${data.task.taskId}`}
            className="truncate text-sm font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {data.task.taskName ?? data.task.taskId}
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className={cn('shrink-0 text-[10px]', meta.badgeClass)}>
            {meta.label}
          </Badge>
          {/* Reorder + remove buttons when idle */}
          {isIdle && (
            <div className="flex items-center gap-0.5 ml-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onMoveUp();
                }}
                disabled={data.isFirst}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onMoveDown();
                }}
                disabled={data.isLast}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onRemove();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Meta row: agent, runtime, model, workflow stage */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2 pl-7">
        {data.task.agentName && (
          <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
            <Bot className="h-2.5 w-2.5" />
            {data.task.agentName}
          </Badge>
        )}
        {data.task.workspaceRuntime && (
          <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
            <Cpu className="h-2.5 w-2.5" />
            {data.task.workspaceRuntime}
          </Badge>
        )}
        {data.task.workspaceModel && (
          <span className="text-[10px] text-muted-foreground">{data.task.workspaceModel}</span>
        )}
        {stageMeta && (
          <Badge variant="outline" className={cn('gap-1 text-[10px] px-1.5 py-0', stageMeta.badgeClass)}>
            {StageIcon && <StageIcon className="h-2.5 w-2.5" />}
            {stageMeta.label}
          </Badge>
        )}
      </div>

      {/* Bottom row: auto toggles + workspace link */}
      <div className="flex items-center justify-between gap-2 pl-7">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <label className="flex items-center gap-1 cursor-pointer">
            <Switch
              checked={data.task.autoReview}
              disabled={isRunning || !isQueued}
              onCheckedChange={(checked) =>
                data.onUpdateTask({
                  autoReview: checked,
                  autoAccept: checked ? data.task.autoAccept : false,
                })
              }
              className="scale-[0.6]"
            />
            Auto-review
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <Switch
              checked={data.task.autoAccept}
              disabled={isRunning || !isQueued || !data.task.autoReview}
              onCheckedChange={(checked) => data.onUpdateTask({ autoAccept: checked })}
              className="scale-[0.6]"
            />
            Auto-accept
          </label>
        </div>
        {data.task.workspaceId && (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-[10px] text-muted-foreground px-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Link to={`/workspaces/${data.task.workspaceId}`}>
              <ExternalLink className="h-2.5 w-2.5" />
              Workspace
            </Link>
          </Button>
        )}
      </div>

      {/* Bottom handle: connects to next task */}
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !border-0 !bg-muted-foreground/40" />
    </div>
  );
}
