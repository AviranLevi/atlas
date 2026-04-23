// React / library
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import { Button } from '@/components/ui/button';
import { CliFallbackBanner } from '@/components/workspaces/CliFallbackBanner';
import { CommitsPanel } from '@/components/workspaces/CommitsPanel';
import { WorkspaceLineage } from '@/components/workspaces/WorkspaceLineage';
import { WorkspaceDetailHeader } from './components/WorkspaceDetailHeader';
import { WorkspaceDialogs } from './components/WorkspaceDialogs';
import { WorkspaceInfoCards } from './components/WorkspaceInfoCards';
import { WorkspaceAgentOutput } from './components/workspace-views/WorkspaceAgentOutput';
import { WorkspaceBody } from './components/workspace-views/WorkspaceBody';

// Hooks
import { useProject } from '@/hooks/use-projects.hook';
import { useReview } from '@/hooks/use-reviews.hook';
import {
  useWorkspaceStatus,
  useWorkspaceLineage,
  useWorkspaceDiff,
  useStopWork,
  useCleanupWorkspace,
  useWorkspaceLogStream,
  useOpenWorkspaceInEditor,
  useStartAiReview,
} from '@/hooks/use-workspaces.hook';

// Lib
import { deriveWorkspaceView } from './workspace-view';

// Types
import type { DiffComment } from '@atlas/shared';

export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workspace, isLoading, error } = useWorkspaceStatus(id);
  const { data: lineage = [] } = useWorkspaceLineage(workspace?.id);
  const stopWork = useStopWork();
  const cleanup = useCleanupWorkspace();
  const openInEditor = useOpenWorkspaceInEditor();
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [rerunOpen, setRerunOpen] = useState(false);
  const { data: project } = useProject(workspace?.projectId);
  const { data: review } = useReview(workspace?.taskId);
  const startAiReview = useStartAiReview();
  const { data: diff } = useWorkspaceDiff(workspace?.id);
  const isLive = workspace?.status === 'running' || workspace?.status === 'pending';
  const streamedLog = useWorkspaceLogStream(workspace?.id, isLive);

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

  const view = deriveWorkspaceView(workspace, review);
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
        view={view}
        onStop={() => stopWork.mutate(workspace.id, { onSuccess: () => navigate('/workspaces') })}
        onRerun={() => setRerunOpen(true)}
        onFollowUp={() => setFollowUpOpen(true)}
        onCleanup={() => cleanup.mutate(workspace.id, { onSuccess: () => navigate('/workspaces') })}
        onOpenInEditor={() => openInEditor.mutate(workspace.id)}
        isStopping={stopWork.isPending}
        isRerunning={false}
        isCleaning={cleanup.isPending}
        isOpeningInEditor={openInEditor.isPending}
      />

      {lineage.length > 1 && <WorkspaceLineage lineage={lineage} currentId={workspace.id} />}
      <CliFallbackBanner workspace={workspace} />
      <WorkspaceInfoCards workspace={workspace} />

      {(workspace.inputTokens != null || workspace.outputTokens != null || workspace.costUsd != null) && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {workspace.inputTokens != null && <span>Input: {workspace.inputTokens.toLocaleString()} tokens</span>}
          {workspace.outputTokens != null && <span>Output: {workspace.outputTokens.toLocaleString()} tokens</span>}
          {workspace.costUsd != null && <span>Cost: ${workspace.costUsd.toFixed(4)}</span>}
        </div>
      )}

      {view.caps.showCommits && <CommitsPanel workspace={workspace} isRunning={workspace.status === 'running'} />}

      <WorkspaceBody
        view={view}
        workspace={workspace}
        review={review}
        diff={diff}
        project={project}
        comments={comments}
        startAiReview={startAiReview}
        onOpenAiReview={() => setAiReviewOpen(true)}
        onOpenFollowUp={() => setFollowUpOpen(true)}
      />

      <WorkspaceAgentOutput view={view} workspace={workspace} streamedLog={streamedLog} />

      <WorkspaceDialogs
        workspace={workspace}
        review={review}
        startAiReview={startAiReview}
        aiReviewOpen={aiReviewOpen}
        setAiReviewOpen={setAiReviewOpen}
        rerunOpen={rerunOpen}
        setRerunOpen={setRerunOpen}
        followUpOpen={followUpOpen}
        setFollowUpOpen={setFollowUpOpen}
        onNavigate={navigate}
      />
    </div>
  );
}
