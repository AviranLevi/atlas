import { useState } from 'react';
import { MessageSquare, X, Pencil, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiffComment } from '@atlas/shared';
import { InlineCommentForm } from './InlineCommentForm';

export function InlineCommentBubble({
  comment,
  replies = [],
  onDelete,
  onEdit,
  onReply,
  isDeleting,
  isEditing,
  isReplying,
}: {
  comment: DiffComment;
  replies?: DiffComment[];
  onDelete: () => void;
  onEdit: (body: string) => void;
  onReply?: (body: string) => void;
  isDeleting: boolean;
  isEditing: boolean;
  isReplying?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);

  if (editing) {
    return (
      <InlineCommentForm
        initialBody={comment.body}
        isPending={isEditing}
        onCancel={() => setEditing(false)}
        onSubmit={(body) => {
          onEdit(body);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="mx-2 my-1">
      <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-2 group">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" />
            <p className="text-xs font-sans whitespace-pre-wrap">{comment.body}</p>
          </div>
          <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {onReply && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={() => setReplying((v) => !v)}
                title="Reply"
              >
                <CornerDownRight className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-foreground"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <span className="mt-1 block text-[9px] text-muted-foreground">
          {new Date(comment.createdAt).toLocaleString()}
        </span>
      </div>

      {replies.length > 0 && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-blue-200 dark:border-blue-900 pl-2">
          {replies.map((reply) => (
            <div key={reply.id} className="rounded-md border border-blue-100 bg-blue-50/60 dark:border-blue-900/60 dark:bg-blue-950/20 p-2">
              <div className="flex items-start gap-2 min-w-0">
                <CornerDownRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-400" />
                <p className="text-xs font-sans whitespace-pre-wrap">{reply.body}</p>
              </div>
              <span className="mt-1 block text-[9px] text-muted-foreground">
                {new Date(reply.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {replying && onReply && (
        <div className="ml-4 mt-0.5 border-l-2 border-blue-200 dark:border-blue-900 pl-2">
          <InlineCommentForm
            isPending={isReplying ?? false}
            onCancel={() => setReplying(false)}
            onSubmit={(body) => {
              onReply(body);
              setReplying(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
