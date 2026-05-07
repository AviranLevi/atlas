// React / library
import { Terminal, Pencil, X, Check } from 'lucide-react';
import { useState, useCallback } from 'react';

// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Hooks
import { useAgentRuntimes } from '@/hooks/use-workspaces.hook';

const NONE_VALUE = '__none__';

export type DefaultRuntimeSelectorProps = {
  value: string | null;
  isPending: boolean;
  onSave: (value: string | null) => void;
};

export function DefaultRuntimeSelector({ value, isPending, onSave }: DefaultRuntimeSelectorProps) {
  const { data: runtimes = [] } = useAgentRuntimes();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string>(NONE_VALUE);

  const installed = runtimes.filter((r) => r.installed);

  const startEditing = useCallback(() => {
    setSelected(value ?? NONE_VALUE);
    setEditing(true);
  }, [value]);

  const cancel = useCallback(() => setEditing(false), []);

  const save = useCallback(() => {
    onSave(selected === NONE_VALUE ? null : selected);
    setEditing(false);
  }, [selected, onSave]);

  const displayLabel = value ? (installed.find((r) => r.id === value)?.name ?? value) : null;

  return (
    <Card className="flex flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          Default Runtime
        </div>
        {!editing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={startEditing}
            aria-label="Edit Default Runtime"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a runtime..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>
                <span className="text-muted-foreground">No default</span>
              </SelectItem>
              {installed.map((rt) => (
                <SelectItem key={rt.id} value={rt.id}>
                  {rt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center justify-end gap-1.5">
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
          <code className="text-sm font-mono">{displayLabel}</code>
        </button>
      ) : (
        <button
          type="button"
          className="cursor-pointer rounded-md border border-dashed p-4 text-center transition-colors hover:bg-muted/50"
          onClick={startEditing}
        >
          <p className="text-muted-foreground text-xs italic">
            Click to set the CLI this agent uses (e.g. claude-code, gemini-cli)...
          </p>
        </button>
      )}
    </Card>
  );
}
