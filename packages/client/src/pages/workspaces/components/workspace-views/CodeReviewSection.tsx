// React / library
import { Bot, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

// Components
import { HintDot } from '@/components/onboarding/HintDot';
import { Button } from '@/components/ui/button';
import { DiffSection } from '@/pages/workspaces/diff';
import { ReviewVerdictPanel } from './ReviewVerdictPanel';

// Hooks
import type { useProject } from '@/hooks/use-projects.hook';
import type { useReview } from '@/hooks/use-reviews.hook';
import type { useStartAiReview, useWorkspaceDiff } from '@/hooks/use-workspaces.hook';

// Lib
import type { WorkspaceView } from '@/pages/workspaces/workspace-view';
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

// Types
import type { DiffComment, Workspace } from '@atlas/shared';

export type CodeReviewSectionProps = {
  workspace: Workspace;
  view: WorkspaceView;
  review: ReturnType<typeof useReview>['data'];
  diff: ReturnType<typeof useWorkspaceDiff>['data'];
  project: ReturnType<typeof useProject>['data'];
  comments: DiffComment[];
  startAiReview: ReturnType<typeof useStartAiReview>;
  onOpenAiReview: () => void;
  onOpenFollowUp: () => void;
};

export function CodeReviewSection({
  workspace,
  view,
  review,
  diff,
  project,
  comments,
  startAiReview,
  onOpenAiReview,
  onOpenFollowUp,
}: CodeReviewSectionProps) {
  // Single source of truth: the `aiReviewing` arm in `deriveWorkspaceView`
  // already encodes status + stageCategory + review.status + reviewerType.
  // Recomputing the predicate here would drift (it used to — we deleted
  // that duplication deliberately).
  const isReviewerRunning = view.kind === 'aiReviewing';

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Code Changes</h2>
          {isReviewerRunning && (
            <span className="flex items-center gap-1 text-xs font-medium text-blue-500">
              <Bot className="h-3.5 w-3.5" />
              AI Review in Progress
            </span>
          )}
          {!isReviewerRunning && review?.status === 'approved' && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              AI Approved
            </span>
          )}
          {!isReviewerRunning && review?.status === 'changes_requested' && (
            <span className="flex items-center gap-1 text-xs font-medium text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              Changes Requested
            </span>
          )}
          {!isReviewerRunning && review?.status === 'pending' && review.reviewerType === 'agent' && (
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              AI Review Pending
            </span>
          )}
        </div>
        {review?.status === 'pending' && !isReviewerRunning && diff && diff.files.length > 0 && (
          <HintDot id="run-ai-review">
            <Button
              data-tour={TOUR_TARGETS.workspaceRunReview}
              variant="outline"
              size="sm"
              onClick={onOpenAiReview}
              disabled={startAiReview.isPending}
            >
              {startAiReview.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Run AI Review
            </Button>
          </HintDot>
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
      {/*
       * Mount the verdict panel whenever the review has a decision. Skip for
       * pending reviews so we don't render empty notes while the reviewer is
       * still running — the banner above already covers that state.
       */}
      {review && review.status !== 'pending' && (
        <ReviewVerdictPanel workspace={workspace} review={review} onFollowUp={onOpenFollowUp} />
      )}
    </div>
  );
}
