import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCode,
  GitMerge,
  GitPullRequest,
  CheckCircle2,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Columns2,
  AlignJustify,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useWorkspaceDiff,
  useMergeWorkspace,
  useCompleteWorkspace,
  useRequestChanges,
  useCreatePR,
  useAddDiffComment,
  useEditDiffComment,
  useRemoveDiffComment,
} from '@/hooks/use-workspaces.hook';
import type { DiffFile } from '@/hooks/use-workspaces.hook';
import type { DiffComment } from '@atlas/shared';
import type { DiffViewMode, CommentingTarget } from './diff-parser';
import { parsePatch } from './diff-parser';
import { detectLanguage } from './lang-detect';
import { UnifiedDiffView } from './unified-diff-view';
import { SplitDiffView } from './split-diff-view';

// ─── DiffFileRow ─────────────────────────────────────────────────────

function DiffFileRow({
  file,
  workspaceId,
  comments,
  viewMode,
}: {
  file: DiffFile;
  workspaceId: string;
  comments: DiffComment[];
  viewMode: DiffViewMode;
}) {
  const [open, setOpen] = useState(false);
  const [commentingLine, setCommentingLine] = useState<CommentingTarget | null>(null);
  const addComment = useAddDiffComment();
  const editComment = useEditDiffComment();
  const removeComment = useRemoveDiffComment();

  const fileComments = comments.filter((c) => c.filename === file.filename);
  const commentsByLine = useMemo(() => {
    const map = new Map<number, DiffComment[]>();
    for (const c of fileComments) {
      const arr = map.get(c.lineNumber) ?? [];
      arr.push(c);
      map.set(c.lineNumber, arr);
    }
    return map;
  }, [fileComments]);

  const parsed = useMemo(() => (file.patch ? parsePatch(file.patch) : []), [file.patch]);
  const language = useMemo(() => detectLanguage(file.filename), [file.filename]);
  const hasComments = fileComments.length > 0;

  const sharedProps = {
    parsed,
    file,
    workspaceId,
    language,
    commentsByLine,
    commentingLine,
    setCommentingLine,
    addComment,
    editComment,
    removeComment,
  };

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={() => file.patch && setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
          file.patch && 'hover:bg-accent cursor-pointer',
          !file.patch && 'cursor-default',
        )}
      >
        {file.patch ? (
          open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate font-mono text-xs">{file.filename}</span>
        {hasComments && (
          <Badge variant="secondary" className="text-[9px] mr-1">
            <MessageSquare className="mr-0.5 h-2.5 w-2.5" />
            {fileComments.length}
          </Badge>
        )}
        <span className="shrink-0 text-xs text-green-600 dark:text-green-400">+{file.additions}</span>
        <span className="shrink-0 text-xs text-red-600 dark:text-red-400 ml-2">-{file.deletions}</span>
      </button>
      {open && file.patch && (
        viewMode === 'unified'
          ? <UnifiedDiffView {...sharedProps} />
          : <SplitDiffView {...sharedProps} />
      )}
    </div>
  );
}

// ─── DiffSection ─────────────────────────────────────────────────────

export function DiffSection({
  workspaceId,
  comments,
  hasGitHub = false,
}: {
  workspaceId: string;
  comments: DiffComment[];
  hasGitHub?: boolean;
}) {
  const { data: diff, isLoading, error } = useWorkspaceDiff(workspaceId);
  const merge = useMergeWorkspace();
  const complete = useCompleteWorkspace();
  const requestChanges = useRequestChanges();
  const createPR = useCreatePR();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<DiffViewMode>(
    () => (localStorage.getItem('diff-view-mode') as DiffViewMode) || 'unified',
  );

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
    return (
      <Card>
        <CardContent className="p-6 text-sm text-red-500">
          Failed to load diff. The worktree may have been removed.
        </CardContent>
      </Card>
    );
  }

  if (diff.files.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <p className="text-sm text-muted-foreground">
            No code changes in this workspace.
          </p>
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

  const hasComments = comments.length > 0;

  return (
    <Card>
      {/* Diff header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-medium">
            {diff.summary.filesChanged} file{diff.summary.filesChanged !== 1 ? 's' : ''} changed
          </span>
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
            <Plus className="h-3.5 w-3.5" />
            {diff.summary.additions}
          </span>
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
            <Minus className="h-3.5 w-3.5" />
            {diff.summary.deletions}
          </span>
          {hasComments && (
            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <MessageSquare className="h-3.5 w-3.5" />
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-md border">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex h-7 w-8 items-center justify-center rounded-l-md text-xs transition-colors',
                    viewMode === 'unified' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                  )}
                  onClick={() => handleViewModeChange('unified')}
                >
                  <AlignJustify className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Unified view</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex h-7 w-8 items-center justify-center rounded-r-md border-l text-xs transition-colors',
                    viewMode === 'split' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                  )}
                  onClick={() => handleViewModeChange('split')}
                >
                  <Columns2 className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Split view</TooltipContent>
            </Tooltip>
          </div>

          {/* Request Changes button — shown when there are unresolved comments */}
          {hasComments && (
            <Button
              variant="outline"
              size="sm"
              className="border-yellow-500/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
              onClick={() => requestChanges.mutate(workspaceId)}
              disabled={requestChanges.isPending}
            >
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
              {requestChanges.isPending ? 'Sending...' : 'Request Changes'}
            </Button>
          )}

          {hasGitHub && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                createPR.mutate(
                  { workspaceId },
                  {
                    onSuccess: (data) => {
                      window.open(data.prUrl, '_blank');
                    },
                  },
                );
              }}
              disabled={createPR.isPending}
            >
              <GitPullRequest className="mr-1.5 h-3.5 w-3.5" />
              {createPR.isPending ? 'Creating PR...' : 'Create PR'}
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              merge.mutate(workspaceId, {
                onSuccess: () => navigate('/workspaces'),
              });
            }}
            disabled={merge.isPending}
          >
            <GitMerge className="mr-1.5 h-3.5 w-3.5" />
            {merge.isPending ? 'Merging...' : 'Accept & Merge'}
          </Button>
        </div>
      </div>

      {/* File list with expandable diffs + inline comments */}
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
    </Card>
  );
}
