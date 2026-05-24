// React / library
import { CheckCircle2, ExternalLink, GitPullRequest, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SecretsWarningDialog } from '@/components/workspaces/SecretsWarningDialog';

// Hooks
import {
  useCompleteWorkspace,
  useCreatePR,
  useMergeWorkspace,
  useRequestChanges,
  useWorkspaceDiff,
} from '@/hooks/use-workspaces.hook';

// Lib
import { ApiError } from '@/lib/api';

// Types
import type { DiffComment } from '@atlas/shared';

// Local
import { DiffFileRow } from './DiffFileRow';
import { DiffToolbar } from './DiffToolbar';
import type { DiffViewMode } from './diff-parser';

type SecretFinding = { filename: string; line: number; pattern: string };

type DiffSectionProps = {
  workspaceId: string;
  comments: DiffComment[];
  hasGitHub?: boolean;
};

export function DiffSection({ workspaceId, comments, hasGitHub = false }: DiffSectionProps) {
  const { data: diff, isLoading, error } = useWorkspaceDiff(workspaceId);
  const merge = useMergeWorkspace();
  const complete = useCompleteWorkspace();
  const requestChanges = useRequestChanges();
  const createPR = useCreatePR();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<DiffViewMode>(
    () => (localStorage.getItem('diff-view-mode') as DiffViewMode) || 'unified',
  );
  const [secretsFindings, setSecretsFindings] = useState<SecretFinding[]>([]);
  const [secretsAction, setSecretsAction] = useState<'merge' | 'create-pr'>('merge');
  const [secretsDialogOpen, setSecretsDialogOpen] = useState(false);

  const handleSecretsError = (err: unknown, action: 'merge' | 'create-pr'): boolean => {
    if (err instanceof ApiError && err.status === 409 && err.details?.secretsDetected) {
      setSecretsFindings((err.details.findings as SecretFinding[]) ?? []);
      setSecretsAction(action);
      setSecretsDialogOpen(true);
      return true;
    }
    return false;
  };

  const handleViewModeChange = (mode: DiffViewMode) => {
    setViewMode(mode);
    localStorage.setItem('diff-view-mode', mode);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading diff...
        </CardContent>
      </Card>
    );
  }

  if (error || !diff) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return (
      <Card>
        <CardContent className="p-6 text-sm text-red-500">Failed to load diff. {msg}</CardContent>
      </Card>
    );
  }

  if (diff.files.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <p className="text-sm text-muted-foreground">No code changes in this workspace.</p>
          <Button
            size="sm"
            onClick={() => {
              complete.mutate(workspaceId, {
                onSuccess: () => navigate('/workspaces'),
              });
            }}
            disabled={complete.isPending}
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            {complete.isPending ? 'Completing...' : 'Approve & Complete'}
          </Button>
        </CardContent>
        {complete.isError && (
          <div className="border-t px-4 py-3 text-sm text-red-500">
            Failed: {(complete.error as Error).message ?? 'Unknown error'}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <DiffToolbar
        filesChanged={diff.summary.filesChanged}
        additions={diff.summary.additions}
        deletions={diff.summary.deletions}
        commentsCount={comments.length}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        hasGitHub={hasGitHub}
        onCreatePR={() =>
          createPR.mutate(
            { workspaceId },
            {
              onSuccess: (data) => {
                window.open(data.prUrl, '_blank');
              },
              onError: (err) => handleSecretsError(err, 'create-pr'),
            },
          )
        }
        isCreatingPR={createPR.isPending}
        onMerge={() =>
          merge.mutate(
            { workspaceId },
            {
              onSuccess: () => navigate('/workspaces'),
              onError: (err) => handleSecretsError(err, 'merge'),
            },
          )
        }
        isMerging={merge.isPending}
        onRequestChanges={() => requestChanges.mutate(workspaceId)}
        isRequestingChanges={requestChanges.isPending}
      />

      <div>
        {diff.files.map((file) => (
          <DiffFileRow
            key={file.filename}
            file={file}
            workspaceId={workspaceId}
            comments={comments}
            viewMode={viewMode}
          />
        ))}
      </div>

      {merge.isError && (
        <div className="border-t px-4 py-3 text-sm text-red-500">
          Merge failed: {(merge.error as Error).message ?? 'Unknown error'}
        </div>
      )}
      {requestChanges.isError && (
        <div className="border-t px-4 py-3 text-sm text-red-500">
          Request changes failed: {(requestChanges.error as Error).message ?? 'Unknown error'}
        </div>
      )}
      {createPR.isError && (
        <div className="border-t px-4 py-3 text-sm text-red-500">
          PR creation failed: {(createPR.error as Error).message ?? 'Unknown error'}
        </div>
      )}
      {createPR.isSuccess && createPR.data && (
        <div className="border-t px-4 py-3 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
          <GitPullRequest className="h-3.5 w-3.5" />
          PR #{createPR.data.prNumber} created
          <a
            href={createPR.data.prUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline hover:no-underline"
          >
            View on GitHub
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      <SecretsWarningDialog
        open={secretsDialogOpen}
        onOpenChange={setSecretsDialogOpen}
        findings={secretsFindings}
        action={secretsAction}
        isPending={merge.isPending || createPR.isPending}
        onForce={() => {
          if (secretsAction === 'merge') {
            merge.mutate({ workspaceId, skipSecretsScan: true }, { onSuccess: () => navigate('/workspaces') });
          } else {
            createPR.mutate(
              { workspaceId, skipSecretsScan: true },
              {
                onSuccess: (data) => {
                  window.open(data.prUrl, '_blank');
                },
              },
            );
          }
        }}
      />
    </Card>
  );
}
