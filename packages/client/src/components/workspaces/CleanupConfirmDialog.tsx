// React / library
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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
import { useCleanupWorkspace } from '@/hooks/use-workspaces.hook';

// Lib
import { api } from '@/lib/api';

// Types
import type { Workspace } from '@atlas/shared';

type PreCleanupResult = {
  isDirty: boolean;
  dirtyFileCount: number;
  isInUse: boolean;
  inUseBy: string | null;
};

type CleanupConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Pick<Workspace, 'id' | 'taskName' | 'branchName' | 'status'>;
  onSuccess?: () => void;
};

export function CleanupConfirmDialog({ open, onOpenChange, workspace, onSuccess }: CleanupConfirmDialogProps) {
  const cleanup = useCleanupWorkspace();

  // Pre-flight check — only runs when dialog is open
  const {
    data: preCheck,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['workspaces', workspace.id, 'pre-cleanup'],
    queryFn: () => api.get<PreCleanupResult>(`/workspaces/${workspace.id}/pre-cleanup`),
    enabled: open,
    staleTime: 0, // Always re-fetch when dialog opens
  });

  const handleCleanup = (): void => {
    const force = preCheck?.isDirty ?? false;
    cleanup.mutate(
      { id: workspace.id, force },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  };

  const isBlocked = preCheck?.isInUse ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Clean up workspace
          </DialogTitle>
          <DialogDescription>
            This will permanently delete the workspace, its worktree, and log file. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Workspace summary */}
          <dl className="space-y-1.5 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-sm">
            {workspace.taskName && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Task</dt>
                <dd className="truncate font-medium">{workspace.taskName}</dd>
              </div>
            )}
            {workspace.branchName && (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Branch</dt>
                <dd className="truncate font-mono text-xs">{workspace.branchName}</dd>
              </div>
            )}
          </dl>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking workspace status...
            </div>
          )}

          {/* Pre-flight fetch error — allow cleanup anyway */}
          {isError && (
            <p className="text-xs text-muted-foreground">Could not check workspace status. You may proceed.</p>
          )}

          {/* Dirty warning */}
          {preCheck?.isDirty && (
            <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This workspace has <strong>{preCheck.dirtyFileCount}</strong> uncommitted file
                {preCheck.dirtyFileCount !== 1 ? 's' : ''}. They will be lost.
              </span>
            </div>
          )}

          {/* In-use blocker */}
          {isBlocked && (
            <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>This worktree is in use by another workspace. Stop that workspace first.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleCleanup} disabled={isBlocked || isLoading || cleanup.isPending}>
            {cleanup.isPending ? 'Cleaning up...' : preCheck?.isDirty ? 'Clean Up (discard changes)' : 'Clean Up'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
