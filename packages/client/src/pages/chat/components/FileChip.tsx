// React / library
import { FileText, File, X } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';

// Types
import type { AttachedFile } from '../chat.types';

interface FileChipProps {
  file: AttachedFile;
  onRemove: (id: string) => void;
}

/** Displays a staged file attachment chip with an optional image thumbnail. */
export function FileChip({ file, onRemove }: FileChipProps) {
  const isImage = file.mimeType.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';

  return (
    <div className="group relative flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 text-xs text-muted-foreground max-w-[160px]">
      {isImage && file.previewUrl ? (
        <img src={file.previewUrl} alt={file.name} className="h-6 w-6 rounded object-cover shrink-0" />
      ) : isPdf ? (
        <FileText className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <File className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="truncate">{file.name}</span>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => onRemove(file.id)}
        className="ml-auto h-4 w-4 shrink-0 rounded-sm opacity-60 hover:opacity-100 -mr-0.5"
        aria-label={`Remove ${file.name}`}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
