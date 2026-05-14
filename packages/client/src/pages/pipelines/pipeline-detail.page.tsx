// React / library
import { ArrowLeft, GitBranch, Loader2, Pause, Play, Square, StepForward } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Components
import { TaskDetailSheet } from '@/components/task-detail/TaskDetailSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PipelineFlow } from './components/PipelineFlow';

// Hooks
import {
  useCancelPipeline,
  usePausePipeline,
  usePipeline,
  useResumePipeline,
  useStartPipeline,
  useUpdatePipelineTask,
} from '@/hooks/use-pipelines.hook';
import { usePreferences } from '@/hooks/use-preferences.hook';

// Constants
import { PIPELINE_STATUS_META } from './pipelines.constants';

export function PipelineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pipeline, isLoading } = usePipeline(id);
  const { data: prefs } = usePreferences();
  const [sheetTaskId, setSheetTaskId] = useState<string | null>(null);

  const start = useStartPipeline();
  const pause = usePausePipeline();
  const resume = useResumePipeline();
  const cancel = useCancelPipeline();
  const updateTask = useUpdatePipelineTask();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-sm text-muted-foreground">Pipeline not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/pipelines')}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Pipelines
        </Button>
      </div>
    );
  }

  const meta = PIPELINE_STATUS_META[pipeline.status] ?? PIPELINE_STATUS_META.idle;
  const completedCount = pipeline.tasks.filter((t) => t.status === 'completed').length;
  const isRunning = pipeline.status === 'running';
  const isPaused = pipeline.status === 'paused';
  const isIdle = pipeline.status === 'idle';
  const isDone = pipeline.status === 'completed' || pipeline.status === 'failed';
  const tasksWithoutAgent = pipeline.tasks.filter((t) => !t.agentId);
  const hasGlobalRuntime = !!prefs?.defaultExecutorId;
  const tasksWithoutRuntime = hasGlobalRuntime
    ? []
    : pipeline.tasks.filter((t) => t.agentId && !t.agentDefaultRuntimeId);
  const canStart = pipeline.tasks.length > 0 && tasksWithoutAgent.length === 0 && tasksWithoutRuntime.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Back */}
      <Button variant="ghost" size="sm" className="h-8 self-start" onClick={() => navigate('/pipelines')}>
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Pipelines
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <GitBranch className="mt-0.5 h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">{pipeline.name}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline" className={meta.badgeClass}>
                {meta.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {completedCount} / {pipeline.tasks.length} tasks completed
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isIdle && (
            <Button size="sm" onClick={() => start.mutate(pipeline.id)} disabled={!canStart || start.isPending}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {start.isPending ? 'Starting...' : 'Start'}
            </Button>
          )}
          {isRunning && (
            <>
              <Button variant="outline" size="sm" onClick={() => pause.mutate(pipeline.id)} disabled={pause.isPending}>
                <Pause className="mr-1.5 h-3.5 w-3.5" />
                Pause
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => cancel.mutate(pipeline.id)}
                disabled={cancel.isPending}
              >
                <Square className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
            </>
          )}
          {isPaused && (
            <>
              <Button size="sm" onClick={() => resume.mutate(pipeline.id)} disabled={resume.isPending}>
                <StepForward className="mr-1.5 h-3.5 w-3.5" />
                {resume.isPending ? 'Resuming...' : 'Resume'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => cancel.mutate(pipeline.id)}
                disabled={cancel.isPending}
              >
                <Square className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
            </>
          )}
          {isDone && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => start.mutate(pipeline.id)}
              disabled={!canStart || start.isPending}
            >
              <Play className="mr-1.5 h-3.5 w-3.5" />
              {start.isPending ? 'Starting...' : 'Re-run'}
            </Button>
          )}
        </div>
      </div>

      {/* Warning: tasks without agent */}
      {tasksWithoutAgent.length > 0 && !isRunning && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          {tasksWithoutAgent.length === 1
            ? `Task "${tasksWithoutAgent[0].taskName ?? tasksWithoutAgent[0].taskId}" has no agent assigned. Assign an agent before starting.`
            : `${tasksWithoutAgent.length} tasks have no agent assigned. Assign agents before starting.`}
        </div>
      )}

      {/* Warning: agents without default runtime */}
      {tasksWithoutRuntime.length > 0 && tasksWithoutAgent.length === 0 && !isRunning && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          {tasksWithoutRuntime.length === 1
            ? `Agent "${tasksWithoutRuntime[0].agentName}" on task "${tasksWithoutRuntime[0].taskName ?? tasksWithoutRuntime[0].taskId}" has no default runtime configured. The pipeline will pause immediately on start.`
            : `${tasksWithoutRuntime.length} tasks have agents without a default runtime. The pipeline will pause immediately on start.`}
        </div>
      )}

      {/* Pipeline flow visualization */}
      <PipelineFlow
        pipeline={pipeline}
        onUpdateTask={(taskId, data) => updateTask.mutate({ id: pipeline.id, taskId, data })}
        onTaskClick={(taskId) => setSheetTaskId(taskId)}
      />

      <TaskDetailSheet taskId={sheetTaskId} onClose={() => setSheetTaskId(null)} />
    </div>
  );
}
