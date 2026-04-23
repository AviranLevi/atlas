// React / library
import { Loader2, X } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { Textarea } from '@/components/ui/textarea';

type DocCreatorProps = {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCreate: () => void;
  onCancel: () => void;
  isCreating: boolean;
};

export function DocCreator({
  title,
  content,
  onTitleChange,
  onContentChange,
  onCreate,
  onCancel,
  isCreating,
}: DocCreatorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">New Document</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Input placeholder="Document title..." value={title} onChange={(e) => onTitleChange(e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <Textarea
          placeholder="Write markdown here..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[400px] font-mono text-xs"
        />
        <div className="rounded-md border p-4 overflow-auto max-h-[500px]">
          <MarkdownContent content={content || '*Preview will appear here...*'} />
        </div>
      </div>
      <Button onClick={onCreate} disabled={!title.trim() || isCreating}>
        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Document
      </Button>
    </div>
  );
}
