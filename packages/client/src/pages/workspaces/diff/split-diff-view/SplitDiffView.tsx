import { useMemo } from 'react';
import { useAddDiffComment, useEditDiffComment, useRemoveDiffComment } from '@/hooks/use-workspaces.hook';
import type { DiffFile } from '@/hooks/use-workspaces.hook';
import type { DiffComment } from '@atlas/shared';
import type { ParsedLine, CommentingTarget } from '../diff-parser';
import { buildSplitRows } from '../diff-parser';
import { SplitDiffSide, InlineCommentForm, InlineCommentBubble } from '../components';

export function SplitDiffView({
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
}: {
  parsed: ParsedLine[];
  file: DiffFile;
  workspaceId: string;
  language?: string;
  commentsByLine: Map<number, DiffComment[]>;
  repliesByParentId: Map<string, DiffComment[]>;
  commentingLine: CommentingTarget | null;
  setCommentingLine: (line: CommentingTarget | null) => void;
  addComment: ReturnType<typeof useAddDiffComment>;
  editComment: ReturnType<typeof useEditDiffComment>;
  removeComment: ReturnType<typeof useRemoveDiffComment>;
}) {
  const splitRows = useMemo(() => buildSplitRows(parsed), [parsed]);

  return (
    <div className="bg-muted/30">
      <div>
        {splitRows.map((row, i) => {
          const leftIdx = row.left?.patchIndex;
          const rightIdx = row.right?.patchIndex;
          const leftComments = leftIdx != null ? (commentsByLine.get(leftIdx) ?? []) : [];
          const rightComments = rightIdx != null && rightIdx !== leftIdx ? (commentsByLine.get(rightIdx) ?? []) : [];

          const isCommentingLeft = leftIdx != null && commentingLine?.patchIndex === leftIdx && commentingLine?.side === 'left';
          const isCommentingRight = rightIdx != null && commentingLine?.patchIndex === rightIdx && commentingLine?.side === 'right';

          const renderComments = (comments: DiffComment[], patchLine?: ParsedLine) =>
            comments.map((c) => (
              <InlineCommentBubble
                key={c.id}
                comment={c}
                replies={repliesByParentId.get(c.id) ?? []}
                onDelete={() => removeComment.mutate({ workspaceId, commentId: c.id })}
                onEdit={(body) => editComment.mutate({ workspaceId, commentId: c.id, body })}
                onReply={patchLine ? (body) =>
                  addComment.mutate({
                    workspaceId,
                    comment: { filename: file.filename, lineNumber: patchLine.patchIndex, lineContent: patchLine.content, body, parentId: c.id },
                  })
                  : undefined}
                isDeleting={removeComment.isPending}
                isEditing={editComment.isPending}
                isReplying={addComment.isPending}
              />
            ));

          const renderForm = (patchLine: ParsedLine) => (
            <InlineCommentForm
              isPending={addComment.isPending}
              onCancel={() => setCommentingLine(null)}
              onSubmit={(body) => {
                addComment.mutate(
                  {
                    workspaceId,
                    comment: {
                      filename: file.filename,
                      lineNumber: patchLine.patchIndex,
                      lineContent: patchLine.content,
                      body,
                    },
                  },
                  { onSuccess: () => setCommentingLine(null) },
                );
              }}
            />
          );

          const hasLeftExtras = leftComments.length > 0 || isCommentingLeft;
          const hasRightExtras = rightComments.length > 0 || isCommentingRight;
          const hasExtras = hasLeftExtras || hasRightExtras;

          return (
            <div key={i}>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <SplitDiffSide
                  line={row.left}
                  side="left"
                  language={language}
                  onClickComment={row.left && (row.left.type === 'add' || row.left.type === 'remove' || row.left.type === 'context')
                    ? () => setCommentingLine(isCommentingLeft ? null : { patchIndex: leftIdx!, side: 'left' })
                    : undefined}
                  isCommenting={isCommentingLeft}
                />
                <SplitDiffSide
                  line={row.right}
                  side="right"
                  language={language}
                  onClickComment={row.right && (row.right.type === 'add' || row.right.type === 'remove' || row.right.type === 'context')
                    ? () => setCommentingLine(isCommentingRight ? null : { patchIndex: rightIdx!, side: 'right' })
                    : undefined}
                  isCommenting={isCommentingRight}
                />
              </div>

              {hasExtras && (
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="border-r border-border/30 min-w-0">
                    {renderComments(leftComments, row.left ?? undefined)}
                    {isCommentingLeft && row.left && renderForm(row.left)}
                  </div>
                  <div className="min-w-0">
                    {renderComments(rightComments, row.right ?? undefined)}
                    {isCommentingRight && row.right && renderForm(row.right)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
