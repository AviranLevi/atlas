// React / library
import { Bot, CheckCircle2, CheckSquare, ListPlus, Loader2, ShieldCheck, Square } from 'lucide-react';

// Components
import { ReviewBadge } from '@/components/reviews/ReviewBadge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MarkdownContent } from '@/components/ui/markdown-content';

// Hooks
import { useDecideReview } from '@/hooks/use-reviews.hook';
import { useApplyReviewFix } from '@/hooks/use-workspaces.hook';

// Types
import type { ChecklistItem, Review, Workspace } from '@atlas/shared';

export type ReviewVerdictPanelProps = {
  workspace: Workspace;
  review: Review;
  onFollowUp: () => void;
};

/**
 * Renders the reviewer's verdict (notes + checklist) and, when the decision
 * is `changes_requested`, the three resolution actions:
 *   - Apply AI Suggestions — spawn implementer with review notes as prompt
 *   - Override and Approve — human gate; marks review approved, task Done
 *   - Create Follow-up Task — opens follow-up dialog with notes pre-filled
 *
 * Mounts only when `review.status !== 'pending'` (caller decides). Do NOT
 * render for pending reviews — the "AI Review in Progress" banner is the
 * responsibility of CodeReviewSection.
 */
export function ReviewVerdictPanel({ workspace, review, onFollowUp }: ReviewVerdictPanelProps) {
  const applyFix = useApplyReviewFix();
  const decide = useDecideReview();

  const showActions = review.status === 'changes_requested';

  const handleApplyFix = () => {
    applyFix.mutate({ workspaceId: workspace.id, agentRuntimeId: workspace.agentRuntime });
  };

  const handleOverride = () => {
    // Confirm dialog is the gate the plan requires — override-approve
    // bypasses the reviewer's verdict and moves the task straight to Done.
    if (!window.confirm('Override the AI reviewer and mark this review as approved? This moves the task to Done.')) {
      return;
    }
    decide.mutate({
      id: review.id,
      data: { decision: 'approved', notes: 'Human override after AI requested changes.' },
    });
  };

  return (
    <div className="mt-4 space-y-4 rounded-md border bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">AI Reviewer Verdict</h3>
          <ReviewBadge status={review.status} />
        </div>
        {review.decidedAt && (
          <span className="text-xs text-muted-foreground">
            {review.reviewerType === 'agent' ? 'AI reviewer' : 'Human'} · {new Date(review.decidedAt).toLocaleString()}
          </span>
        )}
      </div>

      {review.notes?.trim() ? (
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
          <div className="rounded-md bg-background px-3 py-2">
            <MarkdownContent content={review.notes} />
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">The reviewer did not leave any notes.</p>
      )}

      {review.checklist && review.checklist.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Definition of Done</Label>
          <ul className="space-y-1">
            {review.checklist.map((item: ChecklistItem) => (
              <li key={item.item} className="flex items-start gap-2 text-sm">
                {item.checked ? (
                  <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={item.checked ? 'text-muted-foreground line-through' : 'text-foreground'}>
                  {item.item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showActions && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" onClick={handleApplyFix} disabled={applyFix.isPending}>
            {applyFix.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bot className="mr-1.5 h-3.5 w-3.5" />
            )}
            Apply AI Suggestions
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleOverride}
            disabled={decide.isPending}
          >
            {decide.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            )}
            Override and Approve
          </Button>
          <Button size="sm" variant="outline" onClick={onFollowUp}>
            <ListPlus className="mr-1.5 h-3.5 w-3.5" />
            Create Follow-up Task
          </Button>
          {applyFix.isError && (
            <p className="w-full text-sm text-destructive">Apply failed: {(applyFix.error as Error).message}</p>
          )}
          {decide.isError && (
            <p className="w-full text-sm text-destructive">Override failed: {(decide.error as Error).message}</p>
          )}
        </div>
      )}

      {!showActions && review.status === 'approved' && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          No action needed — review is approved.
        </div>
      )}
    </div>
  );
}
