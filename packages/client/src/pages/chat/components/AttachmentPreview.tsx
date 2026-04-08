// React / library
import { FileText, File } from 'lucide-react';

// Types
import type { ChatAttachment } from '@atlas/shared';

interface AttachmentPreviewProps {
  attachments: ChatAttachment[];
}

/** Renders the file attachments that were sent with a user message. */
export function AttachmentPreview({ attachments }: AttachmentPreviewProps) {
  return (
    <div className="flex flex-wrap gap-1.5 justify-end">
      {attachments.map((att) => {
        const isImage = att.mimeType.startsWith('image/');
        const isPdf = att.mimeType === 'application/pdf';

        return (
          <div
            key={att.name}
            className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary-foreground/80 max-w-[180px]"
          >
            {isImage ? (
              <img
                src={`data:${att.mimeType};base64,${att.data}`}
                alt={att.name}
                className="h-6 w-6 rounded object-cover shrink-0"
              />
            ) : isPdf ? (
              <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
            ) : (
              <File className="h-3.5 w-3.5 shrink-0 text-primary" />
            )}
            <span className="truncate">{att.name}</span>
          </div>
        );
      })}
    </div>
  );
}
