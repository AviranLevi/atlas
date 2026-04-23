// React / library
import { Loader2 } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { Textarea } from '@/components/ui/textarea';

type DocEditorProps = {
  title: string;
  content: string;
  previewContent: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
};

export function DocEditor({
  title,
  content,
  previewContent,
  onTitleChange,
  onContentChange,
  onSave,
  onCancel,
  isSaving,
}: DocEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input value={title} onChange={(e) => onTitleChange(e.target.value)} className="max-w-sm font-semibold" />
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[500px] font-mono text-xs"
        />
        <div className="rounded-md border p-4 overflow-auto max-h-[600px]">
          <MarkdownContent content={previewContent || '*Preview will appear here...*'} />
        </div>
      </div>
    </div>
  );
}
