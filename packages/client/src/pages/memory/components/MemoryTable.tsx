// React / library
import { Trash2, ChevronRight, ChevronDown, ArrowUp, ArrowDown, Pin } from 'lucide-react';
import { useState, useMemo } from 'react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MemoryExpandedRow } from './MemoryExpandedRow';

// Hooks
import { useTogglePinMemory } from '@/hooks/use-memory.hook';

// Lib
import { contentPreview } from '@/lib/format';
import { cn } from '@/lib/utils';

// Types
import type { MemoryTableProps, SortKey, SortDir } from '../memory.types';

// Constants
import { formatLastUsed, TYPE_BADGE_VARIANTS } from '../memory.constants';

function SortHeader({
  label,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeSortKey === sortKey;
  return (
    <button
      type="button"
      className="flex items-center gap-1 text-left hover:text-foreground transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        onSort(sortKey);
      }}
    >
      {label}
      {isActive && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
    </button>
  );
}

export function MemoryTable({ memories, projectMap, agentMap, onDelete }: MemoryTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('lastUsed');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const togglePin = useTogglePinMemory();

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const list = [...memories];
    // Pinned memories always float to the top
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = (a.name ?? '').localeCompare(b.name ?? '');
      } else if (sortKey === 'type') {
        cmp = (a.type ?? '').localeCompare(b.type ?? '');
      } else if (sortKey === 'lastUsed') {
        const aVal = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
        const bVal = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
        cmp = aVal - bVal;
      } else if (sortKey === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [memories, sortKey, sortDir]);

  const headerProps = { activeSortKey: sortKey, sortDir, onSort: handleSort };

  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[24px_1fr_auto_auto_auto_auto_auto_auto_auto] gap-3 border-b bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
        <div />
        <SortHeader label="Name" sortKey="name" {...headerProps} />
        <SortHeader label="Type" sortKey="type" {...headerProps} />
        <div>Scope</div>
        <div>Status</div>
        <div>Project</div>
        <div>Agent</div>
        <SortHeader label="Last Used" sortKey="lastUsed" {...headerProps} />
        <div />
      </div>

      {sorted.map((mem) => {
        const isExpanded = expandedIds.has(mem.id);
        const preview = contentPreview(mem.content, 80);
        const agentName = mem.agentId ? (agentMap.get(mem.agentId) ?? '—') : 'Manual';
        const status = mem.status ?? 'active';
        const isSuperseded = status === 'superseded';
        const isArchived = status === 'archived';
        const isInactive = isSuperseded || isArchived;

        return (
          <div key={mem.id} className="border-b last:border-0">
            <button
              type="button"
              className={cn(
                'grid w-full grid-cols-[24px_1fr_auto_auto_auto_auto_auto_auto_auto] items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors text-left',
                isInactive && 'opacity-60',
              )}
              onClick={() => toggleExpand(mem.id)}
            >
              <div className="text-muted-foreground">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {mem.isPinned && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
                  <span className={cn('font-medium truncate text-sm', isInactive && 'line-through')}>{mem.name}</span>
                </div>
                {!isExpanded && preview && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{preview}</p>
                )}
              </div>
              <Badge variant="secondary" className={TYPE_BADGE_VARIANTS[mem.type ?? ''] ?? ''}>
                {mem.type}
              </Badge>
              <Badge variant="outline" className="text-[11px]">
                {mem.scope === 'global' ? 'Global' : 'Project'}
              </Badge>
              <span className="text-[11px]">
                {isSuperseded && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Superseded</span>
                )}
                {isArchived && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Archived</span>
                )}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {mem.projectId ? (projectMap.get(mem.projectId) ?? '—') : '—'}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[100px]">{agentName}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatLastUsed(mem.lastUsed)}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-7 w-7', mem.isPinned && 'text-amber-500')}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin.mutate({ id: mem.id, isPinned: !mem.isPinned });
                  }}
                  aria-label={mem.isPinned ? 'Unpin memory' : 'Pin memory'}
                  title={
                    mem.isPinned ? 'Unpin — stop always loading in agent context' : 'Pin — always load in agent context'
                  }
                >
                  <Pin className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(mem.id);
                  }}
                  aria-label="Delete memory"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </button>

            {isExpanded && <MemoryExpandedRow memory={mem} projectMap={projectMap} agentMap={agentMap} />}
          </div>
        );
      })}
    </div>
  );
}
