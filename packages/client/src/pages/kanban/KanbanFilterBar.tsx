// React / library
import { X } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
import type { KanbanFilterBarProps } from './kanban-page.types';

export function KanbanFilterBar({ agents, agentFilter, onAgentFilterChange, onClearFilters }: KanbanFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={agentFilter ?? '__all__'}
        onValueChange={(v) => onAgentFilterChange(v === '__all__' ? undefined : v)}
      >
        <SelectTrigger className="h-8 w-[200px] text-xs">
          <SelectValue placeholder="All Agents" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Agents</SelectItem>
          {agents.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {agentFilter && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClearFilters}>
          <X className="mr-1 h-3 w-3" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
