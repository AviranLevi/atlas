// React / library
import { useState, useCallback } from 'react';
import { Pencil, X, Check } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// Types
import type { EditableCardProps } from './agents.types';

/** Inline-editable text card for long-form agent fields. */
export function EditableCard({
  icon: Icon,
  label,
  value,
  placeholder,
  onSave,
  isPending,
}: EditableCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEditing = useCallback(() => {
    setDraft(value ?? '');
    setEditing(true);
  }, [value]);

  const cancel = useCallback(() => {
    setEditing(false);
  }, []);

  const save = useCallback(() => {
    const trimmed = draft.trim();
    onSave(trimmed || null);
    setEditing(false);
  }, [draft, onSave]);

  return (
    <Card className="flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </div>
        {!editing && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEditing} aria-label={`Edit ${label}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            rows={8}
            className="min-h-[120px] resize-y text-sm"
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <Button variant="ghost" size="sm" onClick={cancel} disabled={isPending}>
              <X className="mr-1 h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={isPending}>
              <Check className="mr-1 h-3.5 w-3.5" />
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : value ? (
        <button
          type="button"
          className="cursor-pointer rounded-md p-2 text-left transition-colors hover:bg-muted/50"
          onClick={startEditing}
        >
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
            {value}
          </pre>
        </button>
      ) : (
        <button
          type="button"
          className="cursor-pointer rounded-md border border-dashed p-4 text-center transition-colors hover:bg-muted/50"
          onClick={startEditing}
        >
          <p className="text-muted-foreground text-xs italic">{placeholder}</p>
        </button>
      )}
    </Card>
  );
}
