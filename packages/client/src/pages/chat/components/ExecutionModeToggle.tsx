// React / library
import { CheckCheck, FileText, Zap } from 'lucide-react';

// Components
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { ExecutionMode } from '@atlas/shared';

type ExecutionModeToggleProps = {
  mode: ExecutionMode;
  onChange: (mode: ExecutionMode) => void;
  disabled?: boolean;
};

const MODES: { value: ExecutionMode; label: string; icon: React.ReactNode; tooltip: string }[] = [
  {
    value: 'auto',
    label: 'Auto',
    icon: <Zap className="h-3 w-3" />,
    tooltip: 'Agent executes actions immediately',
  },
  {
    value: 'confirm',
    label: 'Confirm',
    icon: <CheckCheck className="h-3 w-3" />,
    tooltip: 'Agent proposes actions and waits for your approval',
  },
  {
    value: 'plan-only',
    label: 'Plan',
    icon: <FileText className="h-3 w-3" />,
    tooltip: 'Agent creates plans only — never executes',
  },
];

/** Three-way segmented toggle controlling how assertively the chat agent acts. */
export function ExecutionModeToggle({ mode, onChange, disabled }: ExecutionModeToggleProps) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden">
      {MODES.map((m) => (
        <Tooltip key={m.value}>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(m.value)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium transition-colors',
                mode === m.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              {m.icon}
              {m.label}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{m.tooltip}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
