// React / library
import { Paperclip, Send, Square } from 'lucide-react';
import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { FileChip } from './FileChip';

// Lib
import { toApiAttachment } from '@/lib/file-utils';

// Types
import type { ChatAttachment } from '@atlas/shared';
import type { AttachedFile, ChatInputProps } from '../chat.types';

// Constants
import { ATTACHMENT_MAX_COUNT, ATTACHMENT_MAX_SIZE_BYTES } from '@atlas/shared';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Reset so the same file can be re-selected after removal
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

  const handleSend = useCallback(async () => {
    const trimmed = value.trim();
    const hasContent = trimmed.length > 0;
    const hasFiles = attachedFiles.length > 0;

    if ((!hasContent && !hasFiles) || disabled) return;

    let apiAttachments: ChatAttachment[] | undefined;
    if (hasFiles) {
      apiAttachments = await Promise.all(attachedFiles.map(toApiAttachment));
      // Revoke image preview URLs now that we're done with them
      for (const f of attachedFiles) {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      }
    }

    onSend(trimmed, apiAttachments);
    setValue('');
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [value, disabled, onSend, attachedFiles]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
    <div className="border-t border-border bg-background p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        {/* Staged file chips */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachedFiles.map((f) => (
              <FileChip key={f.id} file={f} onRemove={handleRemoveFile} />
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILE_TYPES}
            onChange={handleFileChange}
            className="hidden"
            aria-hidden
          />

          {/* Attach button */}
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

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask anything about your project..."
            disabled={disabled || isStreaming}
            rows={1}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />

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
