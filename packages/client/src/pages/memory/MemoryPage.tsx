// React / library
import { useState, useMemo } from 'react';
import { Brain, Plus, Search } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MemoryDialog } from '@/components/memory/MemoryDialog';
import { MemoryTable } from './MemoryTable';

// Hooks
import { useMemories, useDeleteMemory } from '@/hooks/use-memory.hook';
import { useProjects } from '@/hooks/use-projects.hook';
import { useAgents } from '@/hooks/use-agents.hook';
import { useActiveProject } from '@/contexts/ProjectContext';

// Constants
import { TYPE_OPTIONS, SCOPE_OPTIONS } from './memory-page.constants';

export function MemoryPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
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

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p.name])),
    [projects],
  );

  const agentMap = useMemo(
    () => new Map(agents.map((a) => [a.id, a.name])),
    [agents],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return memories;
    const q = search.toLowerCase();
    return memories.filter(
      (m) => (m.name ?? '').toLowerCase().includes(q) || m.content.toLowerCase().includes(q),
    );
  }, [memories, search]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Memory</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Decisions, conventions, and preferences remembered across sessions
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
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
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={scopeFilter} onValueChange={setScopeFilter}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            {SCOPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Brain className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
          <h3 className="mb-1 text-base font-medium">No memories found</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {search
              ? 'Try adjusting your search or filters.'
              : 'Memories are created automatically by agents, or you can add them manually.'}
          </p>
          {!search && (
            <Button onClick={() => setDialogOpen(true)} variant="outline" size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Memory
            </Button>
          )}
        </div>
      ) : (
        <MemoryTable
          memories={filtered}
          projectMap={projectMap}
          agentMap={agentMap}
          onDelete={(id) => { if (confirm('Delete this memory?')) deleteMemory.mutate(id); }}
        />
      )}

      <MemoryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
