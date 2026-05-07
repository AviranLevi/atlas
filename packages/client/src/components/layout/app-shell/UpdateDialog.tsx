// React / library
import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowUpCircle, Check, ExternalLink, Loader2 } from 'lucide-react';

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

// Hooks
import { useServerHealthPoll, useTriggerUpdate, useUpdateCheck, useUpdateProgress } from '@/hooks/use-system.hook';

// Lib
import { cn } from '@/lib/utils';

type UpdateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STEP_LABELS: Record<string, string> = {
  fetching: 'Fetching latest code',
  installing: 'Installing dependencies',
  building: 'Building project',
  starting: 'Starting server',
};

/** Full-screen-ish modal that drives the self-update flow. */
export function UpdateDialog({ open, onOpenChange }: UpdateDialogProps) {
  const updateCheck = useUpdateCheck();
  const triggerUpdate = useTriggerUpdate();
  const [updating, setUpdating] = useState(false);
  const [serverDown, setServerDown] = useState(false);

  // Poll progress while updating
  const progress = useUpdateProgress(updating);
  const progressData = progress.data;

  // When progress fetch fails (server died), flip to health polling
  useEffect(() => {
    if (updating && progress.isError) {
      setServerDown(true);
    }
  }, [updating, progress.isError]);

  // Also detect completion from progress data
  useEffect(() => {
    if (progressData?.status === 'completed') {
      setServerDown(true);
    }
  }, [progressData?.status]);

  // Poll server health once server goes down
  const serverBack = useServerHealthPoll(serverDown);

  // Server came back — update done
  const isDone = serverBack && updating;

  const handleUpdate = useCallback(() => {
    setUpdating(true);
    triggerUpdate.mutate(undefined, {
      onError: () => setUpdating(false),
    });
  }, [triggerUpdate]);

  const handleClose = useCallback(() => {
    if (updating && !isDone) return; // Can't close while updating
    setUpdating(false);
    setServerDown(false);
    onOpenChange(false);
  }, [updating, isDone, onOpenChange]);

  // Auto-reload when done
  useEffect(() => {
    if (isDone) {
      const timer = setTimeout(() => window.location.reload(), 2_000);
      return () => clearTimeout(timer);
    }
  }, [isDone]);

  const failed = progressData?.status === 'failed';
  const currentStep = progressData?.currentStep ?? 0;
  const steps = progressData?.steps ?? ['fetching', 'installing', 'building', 'starting'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showClose={!updating || isDone} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            {isDone ? 'Update Complete' : updating ? 'Updating Atlas' : 'Update Available'}
          </DialogTitle>
          <DialogDescription>
            {isDone
              ? 'Atlas has been updated successfully. Reloading...'
              : updating
                ? 'Please wait while Atlas updates. Do not close this window.'
                : `Version ${updateCheck.data?.latest ?? '?'} is available.`}
          </DialogDescription>
        </DialogHeader>

        {/* Pre-update confirmation */}
        {!updating && (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/50 p-3 text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Current:</span>{' '}
                <span className="font-mono">{updateCheck.data?.current}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Latest:</span>{' '}
                <span className="font-mono">{updateCheck.data?.latest}</span>
              </p>
            </div>
            {updateCheck.data?.releaseUrl && (
              <a
                href={updateCheck.data.releaseUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                View release notes <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Update progress */}
        {updating && !isDone && (
          <div className="space-y-2 py-2">
            {steps.map((step, i) => {
              const isActive = i === currentStep && !failed;
              const isComplete = i < currentStep;
              const isFailed = failed && i === currentStep;

              return (
                <div key={step} className="flex items-center gap-3 text-sm">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {isComplete && <Check className="h-4 w-4 text-green-500" />}
                    {isActive && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {isFailed && <AlertCircle className="h-4 w-4 text-destructive" />}
                    {!isComplete && !isActive && !isFailed && (
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <span
                    className={cn(
                      isActive && 'text-foreground font-medium',
                      isComplete && 'text-muted-foreground',
                      isFailed && 'text-destructive',
                      !isActive && !isComplete && !isFailed && 'text-muted-foreground/60',
                    )}
                  >
                    {STEP_LABELS[step] ?? step}
                  </span>
                </div>
              );
            })}

            {/* Waiting for server to come back */}
            {serverDown && !serverBack && !failed && (
              <div className="flex items-center gap-3 text-sm mt-2 pt-2 border-t border-border">
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                <span className="text-muted-foreground">Waiting for server to restart...</span>
              </div>
            )}

            {failed && progressData?.error && (
              <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {progressData.error}
              </div>
            )}
          </div>
        )}

        {/* Success state */}
        {isDone && (
          <div className="flex items-center gap-3 rounded-md border border-green-500/30 bg-green-500/5 p-3 text-sm text-green-500">
            <Check className="h-5 w-5 shrink-0" />
            <span>Server is back online. Reloading page...</span>
          </div>
        )}

        <DialogFooter>
          {!updating && (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Later
              </Button>
              <Button type="button" onClick={handleUpdate} disabled={triggerUpdate.isPending}>
                {triggerUpdate.isPending ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowUpCircle className="mr-2 h-3.5 w-3.5" />
                )}
                Update now
              </Button>
            </>
          )}
          {failed && (
            <Button type="button" variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
