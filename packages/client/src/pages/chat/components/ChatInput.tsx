// React / library
import { Bot } from 'lucide-react';
import { useCallback, useRef, useState, type KeyboardEvent } from 'react';

// Components
import { FileChip } from './FileChip';
import { ChatInputActionBar } from './ChatInputActionBar';
import { MentionPopover } from './MentionPopover';

// Hooks
import { useAttachedFiles } from '../hooks/use-attachments.hook';
import { useMentions } from '../hooks/use-mentions.hook';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { ChatAttachment } from '@atlas/shared';
import type { ChatInputProps } from '../chat.types';

// Constants
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

const ACCEPTED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  // Extension fallbacks for types browsers may not recognise by MIME
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.md',
  '.csv',
  '.json',
  '.txt',
].join(',');

export function ChatInput({
  onSend,
  disabled,
  isStreaming,
  onAbort,
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
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { attachedFiles, setAttachedFiles, handleFileChange, handleRemoveFile, revokeAllPreviews, resolveAttachments } =
    useAttachedFiles();
  const {
    mentionQuery,
    mentionedAgent,
    filteredAgents,
    handleTextChange,
    handleMentionSelect,
    clearMention,
    clearMentionQuery,
  } = useMentions(setValue, textareaRef);

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    const hasContent = trimmed.length > 0;
    const hasFiles = attachedFiles.length > 0;

    if ((!hasContent && !hasFiles) || disabled) return;

    let apiAttachments: ChatAttachment[] | undefined;
    if (hasFiles) {
      apiAttachments = await resolveAttachments();
      revokeAllPreviews();
    }

    onSend(trimmed, apiAttachments, mentionedAgent?.id);
    setValue('');
    setAttachedFiles([]);
    clearMention();
    clearMentionQuery();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [
    value,
    disabled,
    onSend,
    attachedFiles.length,
    mentionedAgent,
    resolveAttachments,
    revokeAllPreviews,
    setAttachedFiles,
    clearMention,
    clearMentionQuery,
  ]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && mentionQuery !== null) {
      e.preventDefault();
      clearMentionQuery();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const canSend = (value.trim().length > 0 || attachedFiles.length > 0) && !disabled;

  return (
    <div data-tour={TOUR_TARGETS.chatInput} className="border-t border-border bg-background p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachedFiles.map((f) => (
              <FileChip key={f.id} file={f} onRemove={handleRemoveFile} />
            ))}
          </div>
        )}

        {mentionedAgent && (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-0.5 text-xs font-medium">
              <Bot className="h-3 w-3" />@{mentionedAgent.name}
              <button
                type="button"
                onClick={clearMention}
                className="ml-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Remove mentioned agent"
              >
                &times;
              </button>
            </span>
          </div>
        )}

        <div
          className={cn(
            'rounded-lg border border-input bg-background ring-offset-background',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            disabled && 'opacity-50',
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
            className="hidden"
            aria-hidden
          />

          <MentionPopover
            mentionQuery={mentionQuery}
            filteredAgents={filteredAgents}
            onSelect={(agent) => handleMentionSelect(agent, value)}
          />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask anything about your project... (type @ to mention an agent)"
            disabled={disabled || isStreaming}
            rows={1}
            className="w-full resize-none bg-transparent px-3 pt-3 pb-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed"
          />

          <ChatInputActionBar
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
            agents={agents}
            selectedAgentId={selectedAgentId}
            onAgentChange={onAgentChange}
            executionMode={executionMode}
            onExecutionModeChange={onExecutionModeChange}
            disabled={disabled}
            canSend={canSend}
            isStreaming={isStreaming}
            onSend={handleSend}
            onAbort={onAbort}
            onAttachClick={() => fileInputRef.current?.click()}
            attachCount={attachedFiles.length}
          />
        </div>
      </div>
    </div>
  );
}
