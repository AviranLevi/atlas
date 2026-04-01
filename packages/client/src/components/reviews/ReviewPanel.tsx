// React / library
import { Bot, CheckCircle2, CheckSquare, Loader2, RotateCcw, Square } from 'lucide-react';
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ReviewBadge } from './ReviewBadge';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useDecideReview, useReview, useTriggerAiReview, useUpdateReview } from '@/hooks/use-reviews.hook';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { ChecklistItem } from '@atlas/shared';
import type { ReviewPanelProps } from './reviews.types';

export function ReviewPanel({ taskId }: ReviewPanelProps) {
  const { data: review, isLoading } = useReview(taskId);
  const updateReview = useUpdateReview();
  const decideReview = useDecideReview();
  const triggerAiReview = useTriggerAiReview();
  const { data: agents = [] } = useAgents();
  const [notes, setNotes] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-4">Loading review...</div>;
  }

  if (!review) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No review yet. Move this task to "In Review" to create one.
      </div>
    );
  }

  const isDecided = review.status !== 'pending';

  const handleChecklistToggle = (index: number) => {
    if (isDecided || !review.checklist) return;
    const updated = review.checklist.map((item: ChecklistItem, i: number) =>
      i === index ? { ...item, checked: !item.checked } : item,
    );
    updateReview.mutate({ id: review.id, data: { checklist: updated } });
  };

  const handleDecide = (decision: 'approved' | 'changes_requested') => {
    decideReview.mutate({
      id: review.id,
      data: { decision, notes: notes || null },
    });
  };

  const handleAiReview = () => {
    if (!selectedAgentId) return;
    triggerAiReview.mutate({
      id: review.id,
      agentId: selectedAgentId,
      decision: 'approved',
      notes: null,
    });
  };

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Code Review</h4>
        <ReviewBadge status={review.status} />
      </div>

      {review.checklist && review.checklist.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Definition of Done</Label>
          <div className="space-y-1">
            {review.checklist.map((item: ChecklistItem, i: number) => (
              <button
                key={i}
                className={cn(
                  'flex items-start gap-2 w-full text-left text-sm py-0.5',
                  isDecided ? 'cursor-default' : 'hover:text-foreground cursor-pointer',
                )}
                onClick={() => handleChecklistToggle(i)}
                disabled={isDecided}
              >
                {item.checked ? (
                  <CheckSquare className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                ) : (
                  <Square className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                )}
                <span className={item.checked ? 'line-through text-muted-foreground' : ''}>{item.item}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!isDecided && (
        <div className="space-y-2">
          <Label htmlFor="review-notes" className="text-xs text-muted-foreground uppercase tracking-wide">
            Review Notes
          </Label>
          <Textarea
            id="review-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional feedback or notes..."
            rows={3}
          />
        </div>
      )}

      {review.notes && (
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          <span className="font-medium text-xs text-muted-foreground uppercase tracking-wide block mb-1">Notes</span>
          {review.notes}
        </div>
      )}

      {review.decidedAt && (
        <p className="text-xs text-muted-foreground">
          Decided {new Date(review.decidedAt).toLocaleString()}
          {review.reviewerType === 'agent' ? ' by AI agent' : ' by reviewer'}
        </p>
      )}

      {!isDecided && (
        <>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleDecide('approved')}
              disabled={decideReview.isPending}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
              onClick={() => handleDecide('changes_requested')}
              disabled={decideReview.isPending}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Request Changes
            </Button>
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              AI Review
            </Label>
            <div className="flex gap-2">
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAiReview}
                disabled={!selectedAgentId || triggerAiReview.isPending}
              >
                {triggerAiReview.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Run
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
