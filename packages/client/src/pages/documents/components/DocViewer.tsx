// React / library
import { Loader2, Pencil, RefreshCw, Trash2 } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/ui/markdown-content';

// Types
import type { DocType, ProjectDoc } from '@atlas/shared';

// Constants
import { AI_TYPES, TYPE_CONFIG } from '../documents.constants';

type DocViewerProps = {
  doc: ProjectDoc;
  onRegenerate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isRegenerating: boolean;
  isDeleting: boolean;
};

export function DocViewer({ doc, onRegenerate, onEdit, onDelete, isRegenerating, isDeleting }: DocViewerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{doc.title}</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {TYPE_CONFIG[doc.type as DocType]?.label ?? doc.type}
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              {doc.source === 'ai' ? 'AI Generated' : 'Manual'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Updated {new Date(doc.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {AI_TYPES.includes(doc.type as DocType) && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Regenerate
            </Button>
          )}
          {doc.source === 'user' && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete} disabled={isDeleting}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      <div className="rounded-md border p-6 overflow-auto">
        <MarkdownContent content={doc.content || '*No content yet.*'} />
      </div>
    </div>
  );
}
