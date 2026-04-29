// React / library
import { Paperclip, Send, Square, Terminal } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
import type { ChatBackendType, ExecutorStatus, ProviderModel } from '@atlas/shared';

// Constants
import { ATTACHMENT_MAX_COUNT } from '@atlas/shared';

type ChatInputActionBarProps = {
  /** Whether this is a new (unsaved) conversation — controls whether pickers are interactive. */
  isNewChat?: boolean;
  backendType?: ChatBackendType;
  /** API mode: available models. */
  models?: ProviderModel[];
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  /** CLI mode: available installed executors. */
  executors?: ExecutorStatus[];
  selectedExecutorId?: string;
  onExecutorChange?: (id: string) => void;
  /** Mirrors ChatInput's disabled prop — disables the attach button too. */
  disabled?: boolean;
  /** Whether the send button should be enabled. */
  canSend: boolean;
  isStreaming?: boolean;
  onSend: () => void;
  onAbort?: () => void;
  onAttachClick: () => void;
  attachCount: number;
  isCli: boolean;
};

/** Bottom action bar inside the chat input box: pickers, attach button, send/stop. */
export function ChatInputActionBar({
  isNewChat,
  backendType,
  models = [],
  selectedModel,
  onModelChange,
  executors = [],
  selectedExecutorId,
  onExecutorChange,
  disabled,
  canSend,
  isStreaming,
  onSend,
  onAbort,
  onAttachClick,
  attachCount,
  isCli,
}: ChatInputActionBarProps) {
  // Read-only labels for existing (locked) conversations
  const readOnlyLabel = (() => {
    if (isNewChat) return null;
    if (backendType === 'api' && selectedModel) {
      return models.find((m) => m.value === selectedModel)?.label ?? selectedModel;
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
    <div className="flex items-center gap-1.5 px-2 pb-2">
      {/* Executor Select — CLI new chats */}
      {isNewChat && backendType === 'cli' && executors.length > 0 && onExecutorChange && (
        <Select value={selectedExecutorId} onValueChange={onExecutorChange}>
          <SelectTrigger className="h-7 w-auto max-w-[180px] gap-1 border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted focus:ring-0">
            <SelectValue placeholder="Select agent" />
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

      {/* Model Select — API and CLI new chats (when models available) */}
      {isNewChat && models.length > 0 && onModelChange && (
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="h-7 w-auto max-w-[220px] gap-1 border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none hover:bg-muted focus:ring-0">
            <SelectValue placeholder="Select model" />
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

      {/* Existing conversation — read-only label */}
      {readOnlyLabel && <span className="px-2 text-xs text-muted-foreground">{readOnlyLabel}</span>}

      {/* CLI slowness hint */}
      {isCli && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
          <Terminal className="h-3 w-3 shrink-0" />
          CLI · responses may take a while
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
