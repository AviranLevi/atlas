// React / library
import { Brain, Plus, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

// Components
import { EmptyState } from '@/components/empty-state/EmptyState';
import { MemoryDialog } from '@/components/memory/MemoryDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemoryTable } from './components/MemoryTable';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useMemories, useDeleteMemory } from '@/hooks/use-memory.hook';
import { useProjects } from '@/hooks/use-projects.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Constants
import { TYPE_OPTIONS, SCOPE_OPTIONS, STATUS_OPTIONS } from './memory.constants';
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

export function MemoryPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [search, setSearch] = useState('');
  const [deleteMemoryId, setDeleteMemoryId] = useState<string | null>(null);
  const { data: projects = [] } = useProjects();
  const { data: agents = [] } = useAgents();
  const { activeProjectId } = useActiveProject();

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (typeFilter !== 'all') f.type = typeFilter;
    if (scopeFilter !== 'all') f.scope = scopeFilter;
    if (activeProjectId) f.projectId = activeProjectId;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [typeFilter, scopeFilter, activeProjectId]);

  const { data: memories = [], isLoading } = useMemories(filters);
  const deleteMemory = useDeleteMemory();
  const [dialogOpen, setDialogOpen] = useState(false);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const agentMap = useMemo(() => new Map(agents.map((a) => [a.id, a.name])), [agents]);

  const filtered = useMemo(() => {
    let result = memories;
    if (statusFilter !== 'all') result = result.filter((m) => (m.status ?? 'active') === statusFilter);
    if (!search.trim()) return result;
    const q = search.toLowerCase();
    return result.filter((m) => (m.name ?? '').toLowerCase().includes(q) || m.content.toLowerCase().includes(q));
  }, [memories, search, statusFilter]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Memory</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Decisions, conventions, and preferences remembered across sessions
          </p>
        </div>
        <Button data-tour={TOUR_TARGETS.memoryNewBtn} onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Memory
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            {SCOPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger data-tour={TOUR_TARGETS.memoryStatusFilter} className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No memories found"
          body={
            search
              ? 'Try adjusting your search or filters.'
              : 'Decisions, conventions, and preferences agents remember across sessions. Agents add these automatically — you can also add them manually.'
          }
          primaryCta={!search ? { label: 'New Memory', onClick: () => setDialogOpen(true), icon: Plus } : undefined}
        />
      ) : (
        <MemoryTable
          memories={filtered}
          projectMap={projectMap}
          agentMap={agentMap}
          onDelete={(id) => setDeleteMemoryId(id)}
        />
      )}

      <MemoryDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <ConfirmDeleteDialog
        open={!!deleteMemoryId}
        onOpenChange={(open) => !open && setDeleteMemoryId(null)}
        title="Delete memory"
        description="This will permanently delete the memory entry. This action cannot be undone."
        isPending={deleteMemory.isPending}
        onConfirm={() => {
          if (deleteMemoryId) {
            deleteMemory.mutate(deleteMemoryId, { onSuccess: () => setDeleteMemoryId(null) });
          }
        }}
      />
    </div>
  );
}
