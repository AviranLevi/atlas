// React / library
import { RotateCcw } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Lib
import { timeAgo } from '@/lib/format';

// Types
import type { WorktreeCommit } from '@atlas/shared';

type CommitRowProps = {
  commit: WorktreeCommit;
  isRunning: boolean;
  onRevert: (sha: string) => void;
  isReverting: boolean;
};

export function CommitRow({ commit, isRunning, onRevert, isReverting }: CommitRowProps) {
  const hasStep = commit.stepIndex !== null && commit.stepTotal !== null;

  return (
    <div className="flex items-center gap-3 py-2 group">
      <code className="shrink-0 text-xs font-mono text-muted-foreground">{commit.shortSha}</code>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {hasStep && (
            <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
              {commit.stepIndex}/{commit.stepTotal}
            </Badge>
          )}
          <span className="text-sm truncate" title={commit.message}>
            {hasStep ? commit.message.replace(/^step\s+\d+\s*\/\s*\d+\s*:\s*/i, '') : commit.message}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
          <span>{timeAgo(commit.timestamp)}</span>
          <span className="text-green-600 dark:text-green-400">+{commit.insertions}</span>
          <span className="text-red-500 dark:text-red-400">-{commit.deletions}</span>
          <span>
            {commit.filesChanged} file{commit.filesChanged !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isRunning || isReverting}
            onClick={() => onRevert(commit.sha)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isRunning ? 'Stop the agent first' : `Revert to ${commit.shortSha}`}</TooltipContent>
      </Tooltip>
    </div>
  );
}
