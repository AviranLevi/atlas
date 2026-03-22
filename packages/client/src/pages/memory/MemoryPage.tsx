import { useState } from 'react';
import type { Memory } from '@my-agents/shared';
import { Brain, Plus, Pencil, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMemories, useDeleteMemory } from '@/hooks/use-memory.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useActiveProject } from '@/contexts/ProjectContext';
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

const typeBadgeVariants: Record<string, string> = {
  Decision: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Convention: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Preference: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  Problem: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function MemoryPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { data: projects = [] } = useProjects();
  const { activeProjectId } = useActiveProject();

  const filters = (() => {
    const f: Record<string, string> = {};
    if (typeFilter !== 'all') f.type = typeFilter;
    if (scopeFilter !== 'all') f.scope = scopeFilter;
    if (activeProjectId) f.projectId = activeProjectId;
    return Object.keys(f).length > 0 ? f : undefined;
  })();
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

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

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

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
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
            Memories are created automatically by agents as they work, or you can add them manually.
          </p>
          <Button onClick={handleCreate} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Memory
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          {/* Header */}
          <div className="grid grid-cols-[24px_1fr_auto_auto_auto_auto_auto] gap-3 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
            <div />
            <div>Name</div>
            <div>Type</div>
            <div>Scope</div>
            <div>Project</div>
            <div>Last Used</div>
            <div />
          </div>
          {/* Rows */}
          {memories.map((mem) => {
            const isExpanded = expandedIds.has(mem.id);
            return (
              <div key={mem.id} className="border-b last:border-0">
                <div
                  className="grid grid-cols-[24px_1fr_auto_auto_auto_auto_auto] items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(mem.id)}
                >
                  <div className="text-muted-foreground">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="font-medium truncate">{mem.name}</div>
                  <Badge
                    variant="secondary"
                    className={typeBadgeVariants[mem.type] ?? ''}
                  >
                    {mem.type}
                  </Badge>
                  <Badge variant="outline">
                    {mem.scope === 'global' ? 'Global' : 'Project'}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {mem.projectId ? projectMap.get(mem.projectId) ?? '—' : '—'}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatLastUsed(mem.lastUsed)}
                  </span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(mem)}
                      aria-label="Edit memory"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(mem.id)}
                      aria-label="Delete memory"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 pl-11">
                    <div className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap leading-relaxed">
                      {mem.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
