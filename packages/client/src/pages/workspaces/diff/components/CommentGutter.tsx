import { MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CommentGutter({
  isCommentable,
  isActive,
  onClick,
}: {
  isCommentable: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  if (!isCommentable) {
    return <div className="w-6 shrink-0 h-[1.625em]" />;
  }
  return (
    <div className="w-6 shrink-0 flex items-center justify-center h-[1.625em]">
      <button
        type="button"
        className={cn(
          'h-4 w-4 flex items-center justify-center rounded transition-opacity',
          isActive
            ? 'opacity-100 bg-blue-500/20'
            : 'opacity-0 group-hover/line:opacity-100 hover:bg-blue-500/20',
        )}
        onClick={onClick}
      >
        <MessageSquarePlus className="h-3 w-3 text-blue-500" />
      </button>
    </div>
  );
}
