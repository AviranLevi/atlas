// Components
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

// Types
import type { ExecutionMode } from '@atlas/shared';
import type { ChatModeSelectProps } from './chat-input-action-bar.types';

// Constants
import { EXEC_MODES } from './chat-input-action-bar.constants';

/** Dropdown for selecting the chat execution mode (auto / confirm / plan-only). */
export function ChatModeSelect({ executionMode, onExecutionModeChange }: ChatModeSelectProps) {
  const active = EXEC_MODES.find((m) => m.value === executionMode);

  return (
    <Select value={executionMode} onValueChange={(v) => onExecutionModeChange(v as ExecutionMode)}>
      <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 text-xs font-medium text-muted-foreground shadow-none hover:bg-muted focus:ring-0 shrink-0">
        <div className="flex items-center gap-1">
          {active && <active.Icon className="h-3 w-3" />}
          {active?.label ?? 'Mode'}
        </div>
      </SelectTrigger>
      <SelectContent align="start">
        {EXEC_MODES.map(({ value, label, Icon, description }) => (
          <SelectItem key={value} value={value} className="text-xs">
            <div className="flex flex-col gap-0.5 py-0.5">
              <div className="flex items-center gap-1.5 font-medium">
                <Icon className="h-3 w-3" />
                {label}
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">{description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
