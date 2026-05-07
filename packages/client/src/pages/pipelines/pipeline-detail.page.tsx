// React / library
import {
  ArrowLeft,
  Bot,
  Cpu,
  ExternalLink,
  GitBranch,
  ListChecks,
  Loader2,
  Pause,
  Play,
  Sparkles,
  Square,
  StepForward,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

// Hooks
import {
  useCancelPipeline,
  usePausePipeline,
  usePipeline,
  useResumePipeline,
  useStartPipeline,
  useUpdatePipelineTask,
} from '@/hooks/use-pipelines.hook';

// Constants
import { PIPELINE_STATUS_META, TASK_STATUS_META, WORKFLOW_STAGE_META } from './pipelines.constants';

export function PipelineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pipeline, isLoading } = usePipeline(id);

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
  const canStart = pipeline.tasks.length > 0 && tasksWithoutAgent.length === 0;

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
            ? `Task "${tasksWithoutAgent[0].taskName ?? tasksWithoutAgent[0].taskId}" has no agent assigned. Assign an agent with a default runtime before starting.`
            : `${tasksWithoutAgent.length} tasks have no agent assigned. Assign agents with default runtimes before starting.`}
        </div>
      )}

      {/* Task list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pipeline.tasks.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No tasks in this pipeline.</p>
          ) : (
            <div className="divide-y">
              {pipeline.tasks
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((task) => {
                  const taskMeta =
                    TASK_STATUS_META[task.status as keyof typeof TASK_STATUS_META] ?? TASK_STATUS_META.queued;
                  const isCurrent = pipeline.currentTaskId === task.taskId;

                  return (
                    <div
                      key={task.taskId}
                      className={`flex items-center gap-4 px-6 py-3 ${isCurrent ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                    >
                      {/* Position */}
                      <span className="w-5 shrink-0 text-xs text-muted-foreground text-right">
                        {task.position + 1}.
                      </span>

                      {/* Task name + metadata */}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{task.taskName ?? task.taskId}</p>
                        {task.agentName && (
                          <Badge variant="secondary" className="shrink-0 gap-1 text-[10px] px-1.5 py-0">
                            <Bot className="h-2.5 w-2.5" />
                            {task.agentName}
                          </Badge>
                        )}
                        {task.workspaceRuntime && (
                          <Badge variant="secondary" className="shrink-0 gap-1 text-[10px] px-1.5 py-0">
                            <Cpu className="h-2.5 w-2.5" />
                            {task.workspaceRuntime}
                          </Badge>
                        )}
                        {task.workspaceModel && (
                          <span className="shrink-0 text-[10px] text-muted-foreground">{task.workspaceModel}</span>
                        )}
                        {task.workflowEnabled &&
                          (() => {
                            const stageMeta = task.workspaceStage ? WORKFLOW_STAGE_META[task.workspaceStage] : null;
                            const StageIcon = stageMeta?.icon;
                            return (
                              <Badge
                                variant="outline"
                                className={`shrink-0 gap-1 text-[10px] px-1.5 py-0 ${
                                  stageMeta?.badgeClass ??
                                  'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {StageIcon && <StageIcon className="h-2.5 w-2.5" />}
                                {stageMeta?.label ?? 'Workflow'}
                              </Badge>
                            );
                          })()}
                      </div>

                      {/* Auto-review / auto-accept toggles */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Switch
                            checked={task.autoReview}
                            disabled={isRunning || task.status !== 'queued'}
                            onCheckedChange={(checked) =>
                              updateTask.mutate({
                                id: pipeline.id,
                                taskId: task.taskId,
                                data: {
                                  autoReview: checked,
                                  autoAccept: checked ? task.autoAccept : false,
                                },
                              })
                            }
                            className="scale-75"
                          />
                          Auto-review
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <Switch
                            checked={task.autoAccept}
                            disabled={isRunning || task.status !== 'queued' || !task.autoReview}
                            onCheckedChange={(checked) =>
                              updateTask.mutate({
                                id: pipeline.id,
                                taskId: task.taskId,
                                data: { autoAccept: checked },
                              })
                            }
                            className="scale-75"
                          />
                          Auto-accept
                        </label>
                      </div>

                      {/* Workspace link */}
                      {task.workspaceId && (
                        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" asChild>
                          <Link to={`/workspaces/${task.workspaceId}`}>
                            <ExternalLink className="h-3 w-3" />
                            Workspace
                          </Link>
                        </Button>
                      )}

                      {/* Status badge */}
                      <Badge variant="outline" className={`shrink-0 ${taskMeta.badgeClass}`}>
                        {taskMeta.label}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
