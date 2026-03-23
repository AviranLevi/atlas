// React / library
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TaskDialog } from '@/components/kanban/TaskDialog';
import { WorkspaceDetailHeader } from './WorkspaceDetailHeader';
import { WorkspaceInfoCards } from './WorkspaceInfoCards';
import { DiffSection } from './diff';

// Hooks
import {
  useWorkspaceStatus,
  useStopWork,
  useCleanupWorkspace,
  useRerunWorkspace,
} from '@/hooks/use-workspaces.hook';
import { useProject } from '@/hooks/use-projects.hook';

// Types
import type { DiffComment } from '@my-agents/shared';

export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workspace, isLoading, error } = useWorkspaceStatus(id);
  const stopWork = useStopWork();
  const cleanup = useCleanupWorkspace();
  const rerun = useRerunWorkspace();
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const { data: project } = useProject(workspace?.projectId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-sm text-muted-foreground">Workspace not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/workspaces')}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Workspaces
        </Button>
      </div>
    );
  }

  const isActive = workspace.status === 'running' || workspace.status === 'pending';
  const isMerged = workspace.status === 'merged';
  const canReview = workspace.status === 'completed';
  const canRerun = workspace.status === 'failed' || workspace.status === 'stopped' || workspace.status === 'completed';
  const canCleanup = !isActive && !isMerged;
  const comments: DiffComment[] = Array.isArray(workspace.diffComments) ? workspace.diffComments : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8" onClick={() => navigate('/workspaces')}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Workspaces
        </Button>
      </div>

      <WorkspaceDetailHeader
        workspace={workspace}
        isActive={isActive}
        canReview={canReview}
        canRerun={canRerun}
        canCleanup={canCleanup}
        onStop={() => stopWork.mutate(workspace.id, { onSuccess: () => navigate('/workspaces') })}
        onRerun={() => rerun.mutate(
          { workspaceId: workspace.id, agentRuntimeId: workspace.agentRuntime },
          { onSuccess: (newWorkspace) => navigate(`/workspaces/${newWorkspace.id}`) },
        )}
        onFollowUp={() => setFollowUpOpen(true)}
        onCleanup={() => cleanup.mutate(workspace.id, { onSuccess: () => navigate('/workspaces') })}
        isStopping={stopWork.isPending}
        isRerunning={rerun.isPending}
        isCleaning={cleanup.isPending}
      />

      {rerun.isError && (
        <Card className="border-destructive/50">
          <CardContent className="p-3 text-sm text-destructive">
            Re-run failed: {(rerun.error as Error).message ?? 'Unknown error'}
          </CardContent>
        </Card>
      )}

      <WorkspaceInfoCards workspace={workspace} />

      {canReview && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Code Changes</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Hover over a line and click the comment icon to leave inline feedback.
          </p>
          <DiffSection
            workspaceId={workspace.id}
            comments={comments}
            hasGitHub={!!project?.repositoryUrl?.includes('github.com')}
          />
        </div>
      )}

      {(workspace.fullOutput || workspace.output) && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Agent Output</h2>
          <Card>
            <CardContent className="p-0">
              <pre className="max-h-[500px] overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {workspace.fullOutput ?? workspace.output}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      <TaskDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        defaultProjectId={workspace.projectId}
        followUpContext={{
          originalTaskName: workspace.taskName ?? 'Unknown task',
          workspaceId: workspace.id,
          output: workspace.output ?? undefined,
        }}
      />
    </div>
  );
}
