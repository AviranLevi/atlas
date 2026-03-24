import { cn } from '@/lib/utils';
import { useAddDiffComment, useEditDiffComment, useRemoveDiffComment } from '@/hooks/use-workspaces.hook';
import type { DiffFile } from '@/hooks/use-workspaces.hook';
import type { DiffComment } from '@my-agents/shared';
import type { ParsedLine, CommentingTarget } from '../diff-parser';
import { LineNum, CommentGutter, InlineCommentForm, InlineCommentBubble, HighlightedLine } from '../components';

export function UnifiedDiffView({
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
}: {
  parsed: ParsedLine[];
  file: DiffFile;
  workspaceId: string;
  language?: string;
  commentsByLine: Map<number, DiffComment[]>;
  commentingLine: CommentingTarget | null;
  setCommentingLine: (line: CommentingTarget | null) => void;
  addComment: ReturnType<typeof useAddDiffComment>;
  editComment: ReturnType<typeof useEditDiffComment>;
  removeComment: ReturnType<typeof useRemoveDiffComment>;
}) {
  return (
    <div className="overflow-auto bg-muted/30">
      <div className="min-w-fit">
        {parsed.map((line) => {
          const lineComments = commentsByLine.get(line.patchIndex) ?? [];
          const isCommentable = line.type === 'add' || line.type === 'remove' || line.type === 'context';

          return (
            <div key={line.patchIndex}>
              <div
                className={cn(
                  'group/line flex items-stretch font-mono text-[11px] leading-relaxed',
                  line.type === 'add' && 'bg-green-500/10 text-green-700 dark:text-green-300',
                  line.type === 'remove' && 'bg-red-500/10 text-red-700 dark:text-red-300',
                  line.type === 'hunk' && 'text-blue-600 dark:text-blue-400 bg-blue-500/5',
                  line.type === 'meta' && 'text-muted-foreground',
                )}
              >
                <CommentGutter
                  isCommentable={isCommentable}
                  isActive={commentingLine?.patchIndex === line.patchIndex}
                  onClick={() => setCommentingLine(commentingLine?.patchIndex === line.patchIndex ? null : { patchIndex: line.patchIndex, side: 'left' })}
                />
                <LineNum num={line.oldLineNum} />
                <LineNum num={line.newLineNum} />
                <pre className="flex-1 px-2 py-0 whitespace-pre">
                  {line.type === 'add' && <span className="select-none text-green-500/50 mr-1">+</span>}
                  {line.type === 'remove' && <span className="select-none text-red-500/50 mr-1">-</span>}
                  {line.type === 'context' && <span className="select-none text-transparent mr-1">&nbsp;</span>}
                  <HighlightedLine content={line.content} language={language} />
                </pre>
              </div>

              {lineComments.map((c) => (
                <InlineCommentBubble
                  key={c.id}
                  comment={c}
                  onDelete={() => removeComment.mutate({ workspaceId, commentId: c.id })}
                  onEdit={(body) => editComment.mutate({ workspaceId, commentId: c.id, body })}
                  isDeleting={removeComment.isPending}
                  isEditing={editComment.isPending}
                />
              ))}

              {commentingLine?.patchIndex === line.patchIndex && (
                <InlineCommentForm
                  isPending={addComment.isPending}
                  onCancel={() => setCommentingLine(null)}
                  onSubmit={(body) => {
                    addComment.mutate(
                      {
                        workspaceId,
                        comment: {
                          filename: file.filename,
                          lineNumber: line.patchIndex,
                          lineContent: line.content,
                          body,
                        },
                      },
                      { onSuccess: () => setCommentingLine(null) },
                    );
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
