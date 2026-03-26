import { useState } from 'react';
import { MessageSquare, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiffComment } from '@atlas/shared';
import { InlineCommentForm } from './InlineCommentForm';

export function InlineCommentBubble({
  comment,
  onDelete,
  onEdit,
  isDeleting,
  isEditing,
}: {
  comment: DiffComment;
  onDelete: () => void;
  onEdit: (body: string) => void;
  isDeleting: boolean;
  isEditing: boolean;
}) {
  const [editing, setEditing] = useState(false);

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
    <div className="mx-2 my-1 rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-2 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" />
          <p className="text-xs font-sans whitespace-pre-wrap">{comment.body}</p>
        </div>
        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
  );
}
