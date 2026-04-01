// React / library
import { Bot, Loader2, Wrench } from 'lucide-react';
import { useState } from 'react';

// Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// Lib
import { cn } from '@/lib/utils';

export interface AiReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onStart: (autoFix: boolean) => void;
}

export function AiReviewDialog({ open, onOpenChange, isPending, onStart }: AiReviewDialogProps) {
  const [autoFix, setAutoFix] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run AI Review</DialogTitle>
          <DialogDescription>
            An AI agent will review the code changes against the task requirements and definition of done.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={() => setAutoFix((v) => !v)}
          className={cn(
            'flex w-full items-start gap-3 rounded-md border p-4 text-left transition-colors',
            autoFix ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
          )}
        >
          <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-medium">Auto-fix issues</span>
            <span className="text-xs text-muted-foreground">
              If the reviewer finds problems, it will attempt to fix them directly in the code and commit before
              submitting its decision.
            </span>
          </div>
          <div
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 rounded-sm border',
              autoFix ? 'border-primary bg-primary' : 'border-muted-foreground',
            )}
          />
        </button>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={() => onStart(autoFix)} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bot className="mr-1.5 h-3.5 w-3.5" />
            )}
            Start Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
