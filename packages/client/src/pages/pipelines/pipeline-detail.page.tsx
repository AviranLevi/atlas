// React / library
import { ArrowLeft, ExternalLink, GitBranch, Loader2, Pause, Play, Square, StepForward } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

// Hooks
import { useAgentRuntimes } from '@/hooks/use-workspaces.hook';
import {
  useCancelPipeline,
  usePausePipeline,
  usePipeline,
  useResumePipeline,
  useStartPipeline,
  useUpdatePipelineTask,
} from '@/hooks/use-pipelines.hook';

// Constants
import { PIPELINE_STATUS_META, TASK_STATUS_META } from './pipelines.constants';

// Components (local)
import { StartPipelineDialog } from './components/StartPipelineDialog';

export function PipelineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pipeline, isLoading } = usePipeline(id);
  const { data: runtimes = [] } = useAgentRuntimes();

  const start = useStartPipeline();
  const pause = usePausePipeline();
  const resume = useResumePipeline();
  const cancel = useCancelPipeline();
  const updateTask = useUpdatePipelineTask();

  const [startOpen, setStartOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);

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
            <Button size="sm" onClick={() => setStartOpen(true)} disabled={pipeline.tasks.length === 0}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Start
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
              <Button size="sm" onClick={() => setResumeOpen(true)}>
                <StepForward className="mr-1.5 h-3.5 w-3.5" />
                Resume
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
            <Button variant="outline" size="sm" onClick={() => setStartOpen(true)}>
              <Play className="mr-1.5 h-3.5 w-3.5" />
              Re-run
            </Button>
          )}
        </div>
      </div>

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

                      {/* Task name */}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{task.taskName ?? task.taskId}</p>
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

      {/* Dialogs */}
      <StartPipelineDialog
        open={startOpen}
        onOpenChange={setStartOpen}
        runtimes={runtimes}
        title="Start Pipeline"
        description="Choose which agent runtime will execute each task in this pipeline."
        isPending={start.isPending}
        onConfirm={(agentRuntimeId) =>
          start.mutate({ id: pipeline.id, data: { agentRuntimeId } }, { onSuccess: () => setStartOpen(false) })
        }
      />
      <StartPipelineDialog
        open={resumeOpen}
        onOpenChange={setResumeOpen}
        runtimes={runtimes}
        title="Resume Pipeline"
        description="Choose which agent runtime will execute the next task."
        isPending={resume.isPending}
        onConfirm={(agentRuntimeId) =>
          resume.mutate({ id: pipeline.id, data: { agentRuntimeId } }, { onSuccess: () => setResumeOpen(false) })
        }
      />
    </div>
  );
}
