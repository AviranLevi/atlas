// React / library
import { useState } from 'react';
import { GitCommitHorizontal } from 'lucide-react';
import { toast } from 'sonner';

// Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CommitRow } from './CommitRow';

// Hooks
import { useWorkspaceCommits, useRevertWorkspaceCommit } from '@/hooks/use-workspaces.hook';

// Types
import type { Workspace } from '@atlas/shared';

type CommitsPanelProps = {
  workspace: Workspace;
  isRunning: boolean;
};

export function CommitsPanel({ workspace, isRunning }: CommitsPanelProps) {
  const { data: commits = [], isLoading } = useWorkspaceCommits(workspace.id, isRunning);
  const revert = useRevertWorkspaceCommit();
  const [confirmSha, setConfirmSha] = useState<string | null>(null);
  const confirmCommit = commits.find((c) => c.sha === confirmSha);

  const handleRevert = () => {
    if (!confirmSha) return;
    revert.mutate(
      { id: workspace.id, commitSha: confirmSha },
      {
        onSuccess: () => {
          toast.success(`Reverted to ${confirmSha.slice(0, 7)}`);
          setConfirmSha(null);
        },
        onError: (err) => {
          toast.error(`Revert failed: ${(err as Error).message}`);
        },
      },
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GitCommitHorizontal className="h-4 w-4" />
            Commits
            {commits.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {commits.length}
              </Badge>
            )}
            <span className="text-xs font-normal text-muted-foreground ml-auto font-mono truncate max-w-[200px]">
              {workspace.branchName}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading && commits.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">Loading commits...</p>
          )}
          {!isLoading && commits.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No commits yet. Commits appear here as the agent completes each step.
            </p>
          )}
          {commits.length > 0 && (
            <div className="divide-y">
              {commits.map((commit) => (
                <CommitRow
                  key={commit.sha}
                  commit={commit}
                  isRunning={isRunning}
                  onRevert={setConfirmSha}
                  isReverting={revert.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmSha} onOpenChange={(open) => !open && setConfirmSha(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Revert to commit?</DialogTitle>
            <DialogDescription>
              This will hard-reset the branch to{' '}
              <code className="font-mono text-xs">{confirmCommit?.shortSha ?? confirmSha?.slice(0, 7)}</code>
              {confirmCommit && (
                <>
                  {' '}
                  — <span className="italic">{confirmCommit.message}</span>
                </>
              )}
              . All commits after this point will be discarded. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSha(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevert} disabled={revert.isPending}>
              {revert.isPending ? 'Reverting...' : 'Revert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
