// React / library
import { ChevronDown, ChevronRight, FileCode, MessageSquare } from 'lucide-react';
import { useMemo, useState } from 'react';

// Components
import { Badge } from '@/components/ui/badge';

// Hooks
import { useAddDiffComment, useEditDiffComment, useRemoveDiffComment } from '@/hooks/use-workspaces.hook';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { DiffComment } from '@atlas/shared';
import type { DiffFile } from '@/hooks/use-workspaces.hook';

// Local
import { parsePatch } from './diff-parser';
import type { CommentingTarget, DiffViewMode } from './diff-parser';
import { detectLanguage } from './lang-detect';
import { SplitDiffView } from './split-diff-view';
import { UnifiedDiffView } from './unified-diff-view';

type DiffFileRowProps = {
  file: DiffFile;
  workspaceId: string;
  comments: DiffComment[];
  viewMode: DiffViewMode;
};

export function DiffFileRow({ file, workspaceId, comments, viewMode }: DiffFileRowProps) {
  const [open, setOpen] = useState(false);
  const [commentingLine, setCommentingLine] = useState<CommentingTarget | null>(null);
  const addComment = useAddDiffComment();
  const editComment = useEditDiffComment();
  const removeComment = useRemoveDiffComment();

  const fileComments = comments.filter((c) => c.filename === file.filename);
  const topLevelComments = useMemo(() => fileComments.filter((c) => !c.parentId), [fileComments]);
  const commentsByLine = useMemo(() => {
    const map = new Map<number, DiffComment[]>();
    for (const c of topLevelComments) {
      const arr = map.get(c.lineNumber) ?? [];
      arr.push(c);
      map.set(c.lineNumber, arr);
    }
    return map;
  }, [topLevelComments]);
  const repliesByParentId = useMemo(() => {
    const map = new Map<string, DiffComment[]>();
    for (const c of fileComments) {
      if (!c.parentId) continue;
      const arr = map.get(c.parentId) ?? [];
      arr.push(c);
      map.set(c.parentId, arr);
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
    repliesByParentId,
    commentingLine,
    setCommentingLine,
    addComment,
    editComment,
    removeComment,
  };

  const expandable = !file.truncated && !!file.patch;

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={() => expandable && setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
          expandable && 'hover:bg-accent cursor-pointer',
          !expandable && 'cursor-default',
        )}
      >
        {expandable ? (
          open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )
        ) : (
          <FileCode className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate font-mono text-xs">{file.filename}</span>
        {file.truncated && (
          <span className="shrink-0 text-xs text-muted-foreground italic">
            diff too large ({(file.additions + file.deletions).toLocaleString()} lines)
          </span>
        )}
        {hasComments && (
          <Badge variant="secondary" className="text-[9px] mr-1">
            <MessageSquare className="mr-0.5 h-2.5 w-2.5" />
            {fileComments.length}
          </Badge>
        )}
        <span className="shrink-0 text-xs text-green-600 dark:text-green-400">+{file.additions}</span>
        <span className="shrink-0 text-xs text-red-600 dark:text-red-400 ml-2">-{file.deletions}</span>
      </button>
      {open &&
        expandable &&
        (viewMode === 'unified' ? <UnifiedDiffView {...sharedProps} /> : <SplitDiffView {...sharedProps} />)}
    </div>
  );
}
