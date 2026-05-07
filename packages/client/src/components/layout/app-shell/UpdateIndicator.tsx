// React / library
import { ArrowUpCircle } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Hooks
import { useUpdateCheck } from '@/hooks/use-system.hook';

// Lib
import { cn } from '@/lib/utils';

type UpdateIndicatorProps = {
  expanded: boolean;
  onClick: () => void;
};

/** Sidebar badge shown when a new version is available. */
export function UpdateIndicator({ expanded, onClick }: UpdateIndicatorProps) {
  const { data } = useUpdateCheck();

  if (!data?.hasUpdate) return null;

  if (!expanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            className="flex h-8 w-8 items-center justify-center rounded-md text-yellow-500 hover:bg-sidebar-accent transition-colors"
            aria-label={`Update available: v${data.latest}`}
          >
            <ArrowUpCircle className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Update available — v{data.latest}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm',
        'text-yellow-500 hover:bg-sidebar-accent transition-colors',
      )}
    >
      <ArrowUpCircle className="h-4 w-4 shrink-0" />
      <span className="truncate">v{data.latest} available</span>
      <Badge variant="outline" className="ml-auto border-yellow-500/40 text-yellow-500 text-[10px] px-1.5 py-0">
        New
      </Badge>
    </button>
  );
}
