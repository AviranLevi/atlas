// React / library
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { DiffSection } from '@/pages/workspaces/diff';

// Hooks
import type { useProject } from '@/hooks/use-projects.hook';
import type { useReview, useStartAiReview } from '@/hooks/use-reviews.hook';
import type { useWorkspaceDiff } from '@/hooks/use-workspaces.hook';

// Types
import type { DiffComment, Workspace } from '@atlas/shared';

export type CodeReviewSectionProps = {
  workspace: Workspace;
  review: ReturnType<typeof useReview>['data'];
  diff: ReturnType<typeof useWorkspaceDiff>['data'];
  project: ReturnType<typeof useProject>['data'];
  comments: DiffComment[];
  startAiReview: ReturnType<typeof useStartAiReview>;
  onOpenAiReview: () => void;
};

export function CodeReviewSection({
  workspace,
  review,
  diff,
  project,
  comments,
  startAiReview,
  onOpenAiReview,
}: CodeReviewSectionProps) {
  return (
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
        {review?.status === 'pending' && diff && diff.files.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenAiReview}
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
        <p className="text-sm text-destructive mb-3">
          AI review failed: {(startAiReview.error as Error).message}
        </p>
      )}
      <DiffSection
        workspaceId={workspace.id}
        comments={comments}
        hasGitHub={!!project?.repositoryUrl?.includes('github.com')}
      />
    </div>
  );
}
