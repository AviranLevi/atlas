// React / library
import { Paperclip, Send, Terminal } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { ChatAgentSelect } from './ChatAgentSelect';
import { ChatBackendSelect } from './ChatBackendSelect';
import { ChatModeSelect } from './ChatModeSelect';

// Types
import type { ChatInputActionBarProps } from './chat-input-action-bar.types';

// Constants
import { ATTACHMENT_MAX_COUNT } from '@atlas/shared';

/** Bottom action bar: mode → backend/model → agent on the left; attach + send on the right. */
export function ChatInputActionBar({
  isNewChat,
  backendType,
  showBackendToggle,
  onBackendTypeChange,
  providers,
  selectedProviderId,
  onProviderChange,
  models,
  selectedModel,
  onModelChange,
  executors,
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

  return (
    <div className="flex items-center gap-1 px-2 pb-2 flex-wrap">
      {/* Mode — always leftmost */}
      {executionMode && onExecutionModeChange && (
        <ChatModeSelect executionMode={executionMode} onExecutionModeChange={onExecutionModeChange} />
      )}

      {/* Divider */}
      {executionMode && <span className="text-border/60 text-xs shrink-0 select-none">|</span>}

      {/* Backend / model info */}
      <ChatBackendSelect
        isNewChat={isNewChat}
        backendType={backendType}
        showBackendToggle={showBackendToggle}
        onBackendTypeChange={onBackendTypeChange}
        providers={providers}
        selectedProviderId={selectedProviderId}
        onProviderChange={onProviderChange}
        models={models}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        executors={executors}
        selectedExecutorId={selectedExecutorId}
        onExecutorChange={onExecutorChange}
        isStreaming={isStreaming}
      />

      {/* Agent */}
      {agents.length > 0 && onAgentChange && (
        <ChatAgentSelect agents={agents} selectedAgentId={selectedAgentId} onAgentChange={onAgentChange} />
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

      {/* Send */}
      {!isStreaming && (
        <Button size="icon" onClick={onSend} disabled={!canSend} className="h-7 w-7 shrink-0" aria-label="Send message">
          <Send className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
