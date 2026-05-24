// React / library
import { ShieldAlert } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type SecretFinding = {
  filename: string;
  line: number;
  pattern: string;
};

type SecretsWarningDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  findings: SecretFinding[];
  onForce: () => void;
  action: 'merge' | 'create-pr';
  isPending?: boolean;
};

export function SecretsWarningDialog({
  open,
  onOpenChange,
  findings,
  onForce,
  action,
  isPending,
}: SecretsWarningDialogProps) {
  const actionLabel = action === 'merge' ? 'Merge' : 'Create PR';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <ShieldAlert className="h-5 w-5" />
            Potential secrets detected
          </DialogTitle>
          <DialogDescription>
            The diff contains patterns that look like secrets or sensitive data. Review the findings below before
            proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[280px] space-y-1.5 overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
          {findings.map((finding, i) => (
            <div key={`${finding.filename}-${finding.line}-${i}`} className="flex items-start gap-2 text-sm">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <span className="font-mono text-xs">{finding.filename}</span>
                {finding.line > 0 && <span className="text-muted-foreground">:{finding.line}</span>}
                <span className="ml-2 text-muted-foreground">({finding.pattern})</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          This is a best-effort heuristic scan. False positives are possible. If you&apos;re sure these are safe, you
          can proceed.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onForce();
              onOpenChange(false);
            }}
            disabled={isPending}
          >
            {isPending ? `${actionLabel}ing...` : `${actionLabel} Anyway`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
