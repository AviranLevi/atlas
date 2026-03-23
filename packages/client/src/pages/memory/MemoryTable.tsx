// React / library
import { useState } from 'react';
import { Pencil, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Types
import type { MemoryTableProps } from './memory-page.types';

// Constants
import { formatLastUsed, TYPE_BADGE_VARIANTS } from './memory-page.constants';

export function MemoryTable({ memories, projectMap, onEdit, onDelete }: MemoryTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[24px_1fr_auto_auto_auto_auto_auto] gap-3 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
        <div />
        <div>Name</div>
        <div>Type</div>
        <div>Scope</div>
        <div>Project</div>
        <div>Last Used</div>
        <div />
      </div>

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
                className={TYPE_BADGE_VARIANTS[mem.type] ?? ''}
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
                  onClick={() => onEdit(mem)}
                  aria-label="Edit memory"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDelete(mem.id)}
                  aria-label="Delete memory"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

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
  );
}
