// React / library
import { Send } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// Components
import { Button } from '@/components/ui/button';

export function InlineCommentForm({
  onSubmit,
  onCancel,
  isPending,
  initialBody = '',
}: {
  onSubmit: (body: string) => void;
  onCancel: () => void;
  isPending: boolean;
  initialBody?: string;
}) {
  const [body, setBody] = useState(initialBody);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="mx-2 my-1 rounded-md border bg-background p-2 shadow-sm">
      <textarea
        ref={ref}
        className="w-full resize-none rounded border bg-muted/50 px-2 py-1.5 text-xs font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Leave a comment on this line..."
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && body.trim()) {
            onSubmit(body.trim());
          }
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">⌘+Enter to submit</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => body.trim() && onSubmit(body.trim())}
            disabled={!body.trim() || isPending}
          >
            <Send className="mr-1 h-2.5 w-2.5" />
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
