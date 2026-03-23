// React / library
import { useState, useMemo } from 'react';
import { Brain, Plus } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { MemoryDialog } from '@/components/memory/MemoryDialog';
import { MemoryTable } from './MemoryTable';

// Hooks
import { useMemories, useDeleteMemory } from '@/hooks/use-memory.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useActiveProject } from '@/contexts/ProjectContext';

// Types
import type { Memory } from '@my-agents/shared';

// Constants
import { TYPE_OPTIONS, SCOPE_OPTIONS } from './memory-page.constants';

export function MemoryPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const { data: projects = [] } = useProjects();
  const { activeProjectId } = useActiveProject();

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (typeFilter !== 'all') f.type = typeFilter;
    if (scopeFilter !== 'all') f.scope = scopeFilter;
    if (activeProjectId) f.projectId = activeProjectId;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [typeFilter, scopeFilter, activeProjectId]);

  const { data: memories, isLoading } = useMemories(filters);
  const deleteMemory = useDeleteMemory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | undefined>();

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Memory</h1>
          <p className="text-muted-foreground mt-1">
            Decisions, conventions, and preferences remembered across sessions
          </p>
        </div>
        <Button onClick={() => { setEditingMemory(undefined); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          New Memory
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {TYPE_OPTIONS.map((opt) => (
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
          {SCOPE_OPTIONS.map((opt) => (
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
          <Button onClick={() => { setEditingMemory(undefined); setDialogOpen(true); }} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Memory
          </Button>
        </div>
      ) : (
        <MemoryTable
          memories={memories}
          projectMap={projectMap}
          onEdit={(mem) => { setEditingMemory(mem); setDialogOpen(true); }}
          onDelete={(id) => { if (confirm('Delete this memory?')) deleteMemory.mutate(id); }}
        />
      )}

      <MemoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        memory={editingMemory}
      />
    </div>
  );
}
