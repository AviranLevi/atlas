// React / library
import { Cloud, Terminal } from 'lucide-react';

// Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { ChatBackendSelectProps } from './chat-input-action-bar.types';

/** Backend toggle + provider/executor/model selects, or read-only label for existing conversations. */
export function ChatBackendSelect({
  isNewChat,
  backendType,
  showBackendToggle,
  onBackendTypeChange,
  providers = [],
  selectedProviderId,
  onProviderChange,
  models = [],
  selectedModel,
  onModelChange,
  executors = [],
  selectedExecutorId,
  onExecutorChange,
}: ChatBackendSelectProps) {
  const readOnlyLabel = (() => {
    if (isNewChat) return null;
    if (backendType === 'api' && selectedModel) {
      const modelLabel = models.find((m) => m.value === selectedModel)?.label ?? selectedModel;
      const providerName = providers.find((p) => p.id === selectedProviderId)?.name;
      return providerName ? `${providerName} · ${modelLabel}` : modelLabel;
    }
    if (backendType === 'cli' && selectedExecutorId) {
      const exec = executors.find((e) => e.id === selectedExecutorId);
      const execName = exec?.name ?? selectedExecutorId;
      const modelLabel = selectedModel
        ? (exec?.modelPresets?.find((m) => m.value === selectedModel)?.label ?? selectedModel)
        : null;
      return modelLabel ? `${execName} · ${modelLabel}` : execName;
    }
    return null;
  })();

  const triggerCls =
    'h-7 w-auto max-w-[180px] gap-1 border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted focus:ring-0';

  return (
    <>
      {/* API / CLI toggle — new chats only, when both backends exist */}
      {showBackendToggle && onBackendTypeChange && isNewChat && (
        <div className="flex rounded-md border border-border overflow-hidden shrink-0">
          {(['api', 'cli'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onBackendTypeChange(type)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors',
                backendType === type
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {type === 'api' ? <Cloud className="h-3 w-3" /> : <Terminal className="h-3 w-3" />}
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Provider — API new chats */}
      {isNewChat && backendType === 'api' && providers.length > 0 && onProviderChange && (
        <Select value={selectedProviderId} onValueChange={onProviderChange}>
          <SelectTrigger className={triggerCls}>
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Executor — CLI new chats */}
      {isNewChat && backendType === 'cli' && executors.length > 0 && onExecutorChange && (
        <Select value={selectedExecutorId} onValueChange={onExecutorChange}>
          <SelectTrigger className={triggerCls}>
            <SelectValue placeholder="CLI Agent" />
          </SelectTrigger>
          <SelectContent>
            {executors.map((ex) => (
              <SelectItem key={ex.id} value={ex.id} className="text-xs">
                {ex.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Model — new chats */}
      {isNewChat && models.length > 0 && onModelChange && (
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className={cn(triggerCls, 'max-w-[220px]')}>
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.value} value={m.value} className="text-xs">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Read-only label — existing conversations */}
      {readOnlyLabel && <span className="px-1 text-xs text-muted-foreground/70 shrink-0">{readOnlyLabel}</span>}
    </>
  );
}
