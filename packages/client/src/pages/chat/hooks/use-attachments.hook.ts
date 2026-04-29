// React / library
import { useCallback, useState, type ChangeEvent } from 'react';

// Lib
import { toApiAttachment } from '@/lib/file-utils';

// Types
import type { ChatAttachment } from '@atlas/shared';
import type { AttachedFile } from '../chat.types';

// Constants
import { ATTACHMENT_MAX_COUNT, ATTACHMENT_MAX_SIZE_BYTES } from '@atlas/shared';

/** Manages staged file attachments: add, remove, preview URL lifecycle, and API conversion. */
export function useAttachedFiles() {
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

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

  /** Revoke all object URLs — call before clearing attachedFiles on send. */
  const revokeAllPreviews = useCallback(() => {
    for (const f of attachedFiles) {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    }
  }, [attachedFiles]);

  /** Convert staged files to API-ready base64 attachments. */
  const resolveAttachments = useCallback((): Promise<ChatAttachment[]> => {
    return Promise.all(attachedFiles.map(toApiAttachment));
  }, [attachedFiles]);

  return {
    attachedFiles,
    setAttachedFiles,
    handleFileChange,
    handleRemoveFile,
    revokeAllPreviews,
    resolveAttachments,
  };
}
