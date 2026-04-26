// React / library
import { Bot, Paperclip, Send, Square } from 'lucide-react';
import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command';
import { FileChip } from './FileChip';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';

// Lib
import { toApiAttachment } from '@/lib/file-utils';

// Types
import type { ChatAttachment } from '@atlas/shared';
import type { AttachedFile, ChatInputProps } from '../chat.types';

// Constants
import { ATTACHMENT_MAX_COUNT, ATTACHMENT_MAX_SIZE_BYTES } from '@atlas/shared';
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

export function ChatInput({ onSend, disabled, isStreaming, onAbort }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionedAgent, setMentionedAgent] = useState<{ id: string; name: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: agents = [] } = useAgents();

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []);
      const remaining = ATTACHMENT_MAX_COUNT - attachedFiles.length;

      const staged: AttachedFile[] = selected
        .slice(0, remaining)
        .filter((f) => f.size <= ATTACHMENT_MAX_SIZE_BYTES)
        .map((f) => ({
          id: crypto.randomUUID(),
          file: f,
          mimeType: f.type || 'text/plain',
          name: f.name,
          size: f.size,
          previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
        }));

      setAttachedFiles((prev) => [...prev, ...staged]);
      e.target.value = '';
    },
    [attachedFiles.length],
  );

  const handleRemoveFile = useCallback((id: string) => {
    setAttachedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleTextChange = useCallback((newValue: string) => {
    setValue(newValue);

    const lastAtIndex = newValue.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const beforeAt = newValue[lastAtIndex - 1];
      // Only trigger if @ is at start or preceded by whitespace
      if (lastAtIndex === 0 || !beforeAt || /\s/.test(beforeAt)) {
        const afterAt = newValue.slice(lastAtIndex + 1);
        if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
          setMentionQuery(afterAt);
          return;
        }
      }
    }
    setMentionQuery(null);
  }, []);

  const handleMentionSelect = useCallback(
    (agent: { id: string; name: string }) => {
      const lastAtIndex = value.lastIndexOf('@');
      const newValue = value.slice(0, lastAtIndex) + `@${agent.name} `;
      setValue(newValue);
      setMentionedAgent(agent);
      setMentionQuery(null);
      textareaRef.current?.focus();
    },
    [value],
  );

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    const hasContent = trimmed.length > 0;
    const hasFiles = attachedFiles.length > 0;

    if ((!hasContent && !hasFiles) || disabled) return;

    let apiAttachments: ChatAttachment[] | undefined;
    if (hasFiles) {
      apiAttachments = await Promise.all(attachedFiles.map(toApiAttachment));
      for (const f of attachedFiles) {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      }
    }

    onSend(trimmed, apiAttachments, mentionedAgent?.id);
    setValue('');
    setAttachedFiles([]);
    setMentionedAgent(null);
    setMentionQuery(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, disabled, onSend, attachedFiles, mentionedAgent]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && mentionQuery !== null) {
      e.preventDefault();
      setMentionQuery(null);
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

  const filteredAgents =
    mentionQuery !== null ? agents.filter((a) => a.name.toLowerCase().includes(mentionQuery.toLowerCase())) : [];

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
                onClick={() => setMentionedAgent(null)}
                className="ml-0.5 text-muted-foreground hover:text-foreground"
                aria-label="Remove mentioned agent"
              >
                &times;
              </button>
            </span>
          </div>
        )}

        <div className="relative flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
            className="hidden"
            aria-hidden
          />

          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming || disabled || attachedFiles.length >= ATTACHMENT_MAX_COUNT}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Attach file"
            title={
              attachedFiles.length >= ATTACHMENT_MAX_COUNT
                ? `Maximum ${ATTACHMENT_MAX_COUNT} files`
                : 'Attach file (PDF, image, text, code)'
            }
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <div className="relative flex-1">
            {mentionQuery !== null && (
              <div className="absolute bottom-full mb-1 w-64 rounded-md border bg-popover shadow-md z-50">
                <Command shouldFilter={false}>
                  <CommandList>
                    {filteredAgents.length === 0 ? (
                      <CommandEmpty>No agents found</CommandEmpty>
                    ) : (
                      filteredAgents.map((agent) => (
                        <CommandItem key={agent.id} onSelect={() => handleMentionSelect(agent)}>
                          <Bot className="mr-2 h-4 w-4 shrink-0" />
                          <span className="truncate">{agent.name}</span>
                          {agent.description && (
                            <span className="ml-auto truncate max-w-[120px] text-xs text-muted-foreground">
                              {agent.description}
                            </span>
                          )}
                        </CommandItem>
                      ))
                    )}
                  </CommandList>
                </Command>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="Ask anything about your project... (type @ to mention an agent)"
              disabled={disabled || isStreaming}
              rows={1}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
          </div>

          {isStreaming ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={onAbort}
              className="shrink-0"
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" onClick={handleSend} disabled={!canSend} className="shrink-0" aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
