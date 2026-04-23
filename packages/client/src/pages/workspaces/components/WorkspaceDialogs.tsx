// Components
import { TaskDialog } from '@/components/kanban/TaskDialog';
import { RerunDialog } from '@/components/workspaces/RerunDialog';
import { AiReviewDialog } from './AiReviewDialog';

// Hooks
import type { useStartAiReview, useReview } from '@/hooks/use-reviews.hook';

// Types
import type { Workspace } from '@atlas/shared';

export type WorkspaceDialogsProps = {
  workspace: Workspace;
  review: ReturnType<typeof useReview>['data'];
  startAiReview: ReturnType<typeof useStartAiReview>;
  aiReviewOpen: boolean;
  setAiReviewOpen: (open: boolean) => void;
  rerunOpen: boolean;
  setRerunOpen: (open: boolean) => void;
  followUpOpen: boolean;
  setFollowUpOpen: (open: boolean) => void;
  onNavigate: (path: string) => void;
};

export function WorkspaceDialogs({
  workspace,
  review,
  startAiReview,
  aiReviewOpen,
  setAiReviewOpen,
  rerunOpen,
  setRerunOpen,
  followUpOpen,
  setFollowUpOpen,
  onNavigate,
}: WorkspaceDialogsProps) {
  return (
    <>
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
        onSuccess={(newWorkspace) => onNavigate(`/workspaces/${newWorkspace.id}`)}
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
    </>
  );
}
