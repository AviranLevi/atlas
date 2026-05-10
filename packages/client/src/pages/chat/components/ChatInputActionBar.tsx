// React / library
import { Bot, CheckCheck, Cloud, FileText, Paperclip, Send, Square, Terminal, Zap } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Lib
import { cn } from '@/lib/utils';

// Types
import type {
  Agent,
  AgentProvider,
  ChatBackendType,
  ExecutionMode,
  ExecutorStatus,
  ProviderModel,
} from '@atlas/shared';

// Constants
import { ATTACHMENT_MAX_COUNT } from '@atlas/shared';

type ChatInputActionBarProps = {
  isNewChat?: boolean;
  backendType?: ChatBackendType;
  showBackendToggle?: boolean;
  onBackendTypeChange?: (type: ChatBackendType) => void;
  providers?: AgentProvider[];
  selectedProviderId?: string;
  onProviderChange?: (id: string) => void;
  models?: ProviderModel[];
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  executors?: ExecutorStatus[];
  selectedExecutorId?: string;
  onExecutorChange?: (id: string) => void;
  agents?: Agent[];
  selectedAgentId?: string;
  onAgentChange?: (id: string) => void;
  executionMode?: ExecutionMode;
  onExecutionModeChange?: (mode: ExecutionMode) => void;
  disabled?: boolean;
  canSend: boolean;
  isStreaming?: boolean;
  onSend: () => void;
  onAbort?: () => void;
  onAttachClick: () => void;
  attachCount: number;
};

const EXEC_MODES: { value: ExecutionMode; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'auto', label: 'Auto', icon: <Zap className="h-3 w-3" />, description: 'Execute actions immediately' },
  {
    value: 'confirm',
    label: 'Confirm',
    icon: <CheckCheck className="h-3 w-3" />,
    description: 'Propose actions and wait for approval',
  },
  {
    value: 'plan-only',
    label: 'Plan',
    icon: <FileText className="h-3 w-3" />,
    description: 'Plans only, no execution',
  },
];

/** Bottom action bar: mode dropdown on far left, then backend/provider/model/agent, attach + send on right. */
export function ChatInputActionBar({
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
  agents = [],
  selectedAgentId,
  onAgentChange,
  executionMode,
  onExecutionModeChange,
  disabled,
  canSend,
  isStreaming,
  onSend,
  onAbort,
  onAttachClick,
  attachCount,
}: ChatInputActionBarProps) {
  const isCli = backendType === 'cli';
  const activeMode = EXEC_MODES.find((m) => m.value === executionMode);

  // Read-only label for locked (existing) conversations
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

  return (
    <div className="flex items-center gap-1 px-2 pb-2 flex-wrap">
      {/* ── Execution mode dropdown — always leftmost ── */}
      {executionMode && onExecutionModeChange && (
        <Select value={executionMode} onValueChange={(v) => onExecutionModeChange(v as ExecutionMode)}>
          <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 text-xs font-medium text-muted-foreground shadow-none hover:bg-muted focus:ring-0 shrink-0">
            <div className="flex items-center gap-1">
              {activeMode?.icon}
              {activeMode?.label ?? 'Mode'}
            </div>
          </SelectTrigger>
          <SelectContent align="start">
            {EXEC_MODES.map((m) => (
              <SelectItem key={m.value} value={m.value} className="text-xs">
                <div className="flex flex-col gap-0.5 py-0.5">
                  <div className="flex items-center gap-1.5 font-medium">
                    {m.icon}
                    {m.label}
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">{m.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Divider after mode */}
      {executionMode && (readOnlyLabel || isNewChat || agents.length > 0) && (
        <span className="text-border/60 text-xs shrink-0 select-none">|</span>
      )}

      {/* Backend toggle — only when both backends configured, new chat only */}
      {showBackendToggle && onBackendTypeChange && isNewChat && (
        <div className="flex rounded-md border border-border overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => onBackendTypeChange('api')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors',
              backendType === 'api'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Cloud className="h-3 w-3" />
            API
          </button>
          <button
            type="button"
            onClick={() => onBackendTypeChange('cli')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-colors',
              backendType === 'cli'
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Terminal className="h-3 w-3" />
            CLI
          </button>
        </div>
      )}

      {/* Provider select — API new chats */}
      {isNewChat && backendType === 'api' && providers.length > 0 && onProviderChange && (
        <Select value={selectedProviderId} onValueChange={onProviderChange}>
          <SelectTrigger className="h-7 w-auto max-w-[160px] gap-1 border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted focus:ring-0">
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

      {/* Executor select — CLI new chats */}
      {isNewChat && backendType === 'cli' && executors.length > 0 && onExecutorChange && (
        <Select value={selectedExecutorId} onValueChange={onExecutorChange}>
          <SelectTrigger className="h-7 w-auto max-w-[160px] gap-1 border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted focus:ring-0">
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

      {/* Model select — new chats with models available */}
      {isNewChat && models.length > 0 && onModelChange && (
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="h-7 w-auto max-w-[200px] gap-1 border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted focus:ring-0">
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

      {/* Agent picker — shown when agents exist */}
      {agents.length > 0 && onAgentChange && (
        <Select value={selectedAgentId ?? ''} onValueChange={onAgentChange}>
          <SelectTrigger className="h-7 w-auto max-w-[160px] gap-1 border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted focus:ring-0">
            <Bot className="h-3 w-3 shrink-0" />
            <SelectValue placeholder="No agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" className="text-xs">
              No agent
            </SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id} className="text-xs">
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* CLI hint */}
      {isCli && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground/50 shrink-0">
          <Terminal className="h-3 w-3" />
          CLI
        </span>
      )}

      <div className="flex-1" />

      {/* Attach */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onAttachClick}
        disabled={disabled || isStreaming || attachCount >= ATTACHMENT_MAX_COUNT}
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
        aria-label="Attach file"
        title={
          attachCount >= ATTACHMENT_MAX_COUNT
            ? `Maximum ${ATTACHMENT_MAX_COUNT} files`
            : 'Attach file (PDF, image, text, code)'
        }
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {/* Send / Stop */}
      {isStreaming ? (
        <Button
          size="icon"
          variant="destructive"
          onClick={onAbort}
          className="h-7 w-7 shrink-0"
          aria-label="Stop generating"
        >
          <Square className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button size="icon" onClick={onSend} disabled={!canSend} className="h-7 w-7 shrink-0" aria-label="Send message">
          <Send className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
