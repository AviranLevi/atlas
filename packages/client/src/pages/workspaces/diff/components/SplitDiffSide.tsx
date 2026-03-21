import { MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParsedLine } from '../diff-parser';
import { LineNum } from './LineNum';

export function SplitDiffSide({
  line,
  side,
  onClickComment,
  isCommenting,
}: {
  line?: ParsedLine;
  side: 'left' | 'right';
  onClickComment?: () => void;
  isCommenting?: boolean;
}) {
  const isCommentable = line && (line.type === 'add' || line.type === 'remove' || line.type === 'context');

  if (!line) {
    return (
      <div className="flex items-start bg-muted/20 border-r border-border/30 last:border-r-0 min-w-0 overflow-hidden">
        <div className="w-6 shrink-0 h-[1.625em]" />
        <LineNum />
        <pre className="flex-1 px-2 py-0 font-mono text-[11px] leading-relaxed min-w-0 overflow-hidden">&nbsp;</pre>
      </div>
    );
  }

  if (line.type === 'hunk' || line.type === 'meta') {
    return (
      <div className="flex items-start text-blue-600 dark:text-blue-400 bg-blue-500/5 border-r border-border/30 last:border-r-0 min-w-0 overflow-hidden">
        <div className="w-6 shrink-0 h-[1.625em]" />
        <LineNum />
        <pre className="flex-1 px-2 py-0 font-mono text-[11px] leading-relaxed min-w-0 overflow-hidden whitespace-pre-wrap break-all">
          {line.content}
        </pre>
      </div>
    );
  }

  const num = side === 'left' ? line.oldLineNum : line.newLineNum;

  return (
    <div
      className={cn(
        'group/side flex items-start font-mono text-[11px] leading-relaxed border-r border-border/30 last:border-r-0 min-w-0 overflow-hidden',
        line.type === 'add' && 'bg-green-500/10 text-green-700 dark:text-green-300',
        line.type === 'remove' && 'bg-red-500/10 text-red-700 dark:text-red-300',
      )}
    >
      <div className="w-6 shrink-0 flex items-center justify-center h-[1.625em]">
        {isCommentable && onClickComment && (
          <button
            type="button"
            className={cn(
              'h-4 w-4 flex items-center justify-center rounded transition-opacity',
              isCommenting
                ? 'opacity-100 bg-blue-500/20'
                : 'opacity-0 group-hover/side:opacity-100 hover:bg-blue-500/20',
            )}
            onClick={onClickComment}
          >
            <MessageSquarePlus className="h-3 w-3 text-blue-500" />
          </button>
        )}
      </div>
      <LineNum num={num} />
      <pre className="flex-1 px-2 py-0 whitespace-pre-wrap break-all min-w-0 overflow-hidden">{line.content}</pre>
    </div>
  );
}
