// React / library
import {
  AlertTriangle,
  AlignJustify,
  Columns2,
  GitMerge,
  GitPullRequest,
  MessageSquare,
  Minus,
  Plus,
} from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Lib
import { cn } from '@/lib/utils';

// Local
import type { DiffViewMode } from './diff-parser';

type DiffToolbarProps = {
  filesChanged: number;
  additions: number;
  deletions: number;
  commentsCount: number;
  viewMode: DiffViewMode;
  onViewModeChange: (mode: DiffViewMode) => void;
  hasGitHub: boolean;
  onCreatePR: () => void;
  isCreatingPR: boolean;
  onMerge: () => void;
  isMerging: boolean;
  onRequestChanges: () => void;
  isRequestingChanges: boolean;
};

export function DiffToolbar({
  filesChanged,
  additions,
  deletions,
  commentsCount,
  viewMode,
  onViewModeChange,
  hasGitHub,
  onCreatePR,
  isCreatingPR,
  onMerge,
  isMerging,
  onRequestChanges,
  isRequestingChanges,
}: DiffToolbarProps) {
  const hasComments = commentsCount > 0;
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium">
          {filesChanged} file{filesChanged !== 1 ? 's' : ''} changed
        </span>
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
          <Plus className="h-3.5 w-3.5" />
          {additions}
        </span>
        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
          <Minus className="h-3.5 w-3.5" />
          {deletions}
        </span>
        {hasComments && (
          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <MessageSquare className="h-3.5 w-3.5" />
            {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-md border">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={cn(
                  'flex h-7 w-8 items-center justify-center rounded-l-md text-xs transition-colors',
                  viewMode === 'unified' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                )}
                onClick={() => onViewModeChange('unified')}
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
                onClick={() => onViewModeChange('split')}
              >
                <Columns2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Split view</TooltipContent>
          </Tooltip>
        </div>

        {hasComments && (
          <Button
            variant="outline"
            size="sm"
            className="border-yellow-500/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
            onClick={onRequestChanges}
            disabled={isRequestingChanges}
          >
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            {isRequestingChanges ? 'Sending...' : 'Request Changes'}
          </Button>
        )}

        {hasGitHub && (
          <Button variant="outline" size="sm" onClick={onCreatePR} disabled={isCreatingPR}>
            <GitPullRequest className="mr-1.5 h-3.5 w-3.5" />
            {isCreatingPR ? 'Creating PR...' : 'Create PR'}
          </Button>
        )}

        <Button size="sm" onClick={onMerge} disabled={isMerging}>
          <GitMerge className="mr-1.5 h-3.5 w-3.5" />
          {isMerging ? 'Merging...' : 'Accept & Merge'}
        </Button>
      </div>
    </div>
  );
}
