// React / library
import { GitBranch, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Hooks
import { useActiveProject } from '@/contexts/ProjectContext';
import { useDeletePipeline, usePipelines } from '@/hooks/use-pipelines.hook';
import { useTasks } from '@/hooks/use-tasks.hook';

// Components (local)
import { CreatePipelineDialog } from './components/CreatePipelineDialog';

// Constants
import { PIPELINE_STATUS_META } from './pipelines.constants';

export function PipelinesPage() {
  const navigate = useNavigate();
  const { activeProjectId } = useActiveProject();
  const { data: pipelines = [], isLoading } = usePipelines(activeProjectId ?? undefined);
  const { data: tasks = [] } = useTasks(activeProjectId ? { projectId: activeProjectId } : undefined);
  const deletePipeline = useDeletePipeline();
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GitBranch className="h-7 w-7 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipelines</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Run tasks sequentially — each one starts after the previous is approved
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} disabled={tasks.length === 0}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Pipeline
        </Button>
      </div>

      {pipelines.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No pipelines yet"
          body="Create a pipeline to run tasks one after another automatically. Each task starts once the previous one is approved."
          primaryCta={{ label: 'New Pipeline', onClick: () => setCreateOpen(true) }}
          compact
        />
      ) : (
        <div className="flex flex-col gap-3">
          {pipelines.map((pipeline) => {
            const meta = PIPELINE_STATUS_META[pipeline.status] ?? PIPELINE_STATUS_META.idle;
            return (
              <Card
                key={pipeline.id}
                className="cursor-pointer transition-colors hover:bg-accent/30"
                onClick={() => navigate(`/pipelines/${pipeline.id}`)}
              >
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">{pipeline.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(pipeline.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={meta.badgeClass}>
                      {meta.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePipeline.mutate(pipeline.id);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreatePipelineDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={activeProjectId ?? ''}
        tasks={tasks}
        onCreated={(pipeline) => navigate(`/pipelines/${pipeline.id}`)}
      />
    </div>
  );
}
