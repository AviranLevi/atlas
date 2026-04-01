// React / library
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import { TaskDialog } from '@/components/kanban/TaskDialog';
import { Button } from '@/components/ui/button';
import { RerunDialog } from '@/components/workspaces/RerunDialog';
import { AiReviewDialog } from './components/AiReviewDialog';
import { TerminalOutput } from './components/TerminalOutput';
import { WorkspaceDetailHeader } from './components/WorkspaceDetailHeader';
import { WorkspaceInfoCards } from './components/WorkspaceInfoCards';
import { DiffSection } from './diff';

// Hooks
import { useProject } from '@/hooks/use-projects.hook';
import { useReview, useStartAiReview } from '@/hooks/use-reviews.hook';
import {
  useWorkspaceStatus,
  useStopWork,
  useCleanupWorkspace,
  useWorkspaceLogStream,
} from '@/hooks/use-workspaces.hook';

// Types
import type { DiffComment } from '@atlas/shared';

export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workspace, isLoading, error } = useWorkspaceStatus(id);
  const stopWork = useStopWork();
  const cleanup = useCleanupWorkspace();
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [rerunOpen, setRerunOpen] = useState(false);
  const { data: project } = useProject(workspace?.projectId);
  const { data: review } = useReview(workspace?.taskId);
  const startAiReview = useStartAiReview();
  const isActive = workspace?.status === 'running' || workspace?.status === 'pending';
  const streamedLog = useWorkspaceLogStream(workspace?.id, isActive);

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
        onRerun={() => setRerunOpen(true)}
        onFollowUp={() => setFollowUpOpen(true)}
        onCleanup={() => cleanup.mutate(workspace.id, { onSuccess: () => navigate('/workspaces') })}
        isStopping={stopWork.isPending}
        isRerunning={false}
        isCleaning={cleanup.isPending}
      />

      <WorkspaceInfoCards workspace={workspace} />

      {canReview && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Code Changes</h2>
              {review?.status === 'approved' && (
                <span className="flex items-center gap-1 text-xs font-medium text-green-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  AI Approved
                </span>
              )}
              {review?.status === 'changes_requested' && (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <XCircle className="h-3.5 w-3.5" />
                  Changes Requested
                </span>
              )}
              {review?.status === 'pending' && review.reviewerType === 'agent' && (
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  AI Review Pending
                </span>
              )}
            </div>
            {review?.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiReviewOpen(true)}
                disabled={startAiReview.isPending || workspace.status === 'running'}
              >
                {startAiReview.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Run AI Review
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Hover over a line and click the comment icon to leave inline feedback.
          </p>
          {startAiReview.isError && (
            <p className="text-sm text-destructive mb-3">AI review failed: {(startAiReview.error as Error).message}</p>
          )}
          <DiffSection
            workspaceId={workspace.id}
            comments={comments}
            hasGitHub={!!project?.repositoryUrl?.includes('github.com')}
          />
        </div>
      )}

      {(isActive || workspace.fullOutput || workspace.output) && (
        <TerminalOutput
          text={isActive ? (streamedLog ?? '') : (workspace.fullOutput ?? workspace.output ?? '')}
          isLive={isActive}
        />
      )}

      {review && (
        <AiReviewDialog
          open={aiReviewOpen}
          onOpenChange={setAiReviewOpen}
          isPending={startAiReview.isPending}
          onStart={(autoFix) => {
            startAiReview.mutate(
              { id: review.id, agentRuntimeId: workspace.agentRuntime, autoFix },
              { onSuccess: () => setAiReviewOpen(false) },
            );
          }}
        />
      )}

      <RerunDialog
        open={rerunOpen}
        onOpenChange={setRerunOpen}
        workspace={workspace}
        onSuccess={(newWorkspace) => navigate(`/workspaces/${newWorkspace.id}`)}
      />

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
