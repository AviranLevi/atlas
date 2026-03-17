import { useState } from 'react';
import type { Memory } from '@my-agents/shared';
import { Brain, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMemories, useDeleteMemory } from '@/hooks/use-memory.hook';
import { MemoryDialog } from '@/components/memory/MemoryDialog';

function formatLastUsed(date: string | null): string {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(diff / 2592000000);
  const years = Math.floor(diff / 31536000000);
  if (years > 0) return rtf.format(-years, 'year');
  if (months > 0) return rtf.format(-months, 'month');
  if (days > 0) return rtf.format(-days, 'day');
  if (hours > 0) return rtf.format(-hours, 'hour');
  if (minutes > 0) return rtf.format(-minutes, 'minute');
  return rtf.format(-seconds, 'second');
}

export function MemoryPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const filters =
    typeFilter !== 'all' || scopeFilter !== 'all'
      ? {
          ...(typeFilter !== 'all' && { type: typeFilter }),
          ...(scopeFilter !== 'all' && { scope: scopeFilter }),
        }
      : undefined;
  const { data: memories, isLoading } = useMemories(filters);
  const deleteMemory = useDeleteMemory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | undefined>();

  const handleCreate = () => {
    setEditingMemory(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this memory?')) {
      deleteMemory.mutate(id);
    }
  };

  const typeOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'Decision', label: 'Decision' },
    { value: 'Convention', label: 'Convention' },
    { value: 'Preference', label: 'Preference' },
    { value: 'Problem', label: 'Problem' },
  ];

  const scopeOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'global', label: 'Global' },
    { value: 'project', label: 'Project' },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Memory</h1>
          <p className="text-muted-foreground mt-1">
            Decisions, conventions, and preferences remembered across sessions
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Memory
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {typeOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={typeFilter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {scopeOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={scopeFilter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center">Loading...</div>
      ) : !memories?.length ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Brain className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-1 text-lg font-medium">No memories yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first memory to capture decisions, conventions, and preferences.
          </p>
          <Button onClick={handleCreate} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Memory
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <div>Name</div>
            <div>Type</div>
            <div>Scope</div>
            <div>Last Used</div>
            <div />
          </div>
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b px-4 py-3 last:border-0"
            >
              <div className="font-medium">{memory.name}</div>
              <Badge variant="secondary">{memory.type}</Badge>
              <Badge variant="outline">{memory.scope}</Badge>
              <div className="text-muted-foreground text-sm">
                {formatLastUsed(memory.lastUsed)}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(memory)}
                  aria-label="Edit memory"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(memory.id)}
                  aria-label="Delete memory"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MemoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memory={editingMemory}
      />
    </div>
  );
}
