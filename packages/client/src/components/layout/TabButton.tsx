// Components
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Types
import type { TabButtonProps } from './layout.types';

export function TabButton({ active, onClick, color, label, icon }: TabButtonProps) {
  return (
    <Tooltip delayDuration={500}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors',
            'hover:text-foreground',
            active
              ? 'text-foreground'
              : 'text-muted-foreground hover:bg-accent/50',
          )}
        >
          {icon || (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: color ?? '#64748b' }}
            />
          )}
          <span className="max-w-[120px] truncate">{label}</span>
          {active && (
            <span
              className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-primary"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
