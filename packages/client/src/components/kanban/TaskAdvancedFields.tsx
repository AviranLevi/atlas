// React / library
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

// Components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
import type { TaskAdvancedFieldsProps } from './kanban.types';

export function TaskAdvancedFields({
  tagsInput,
  onTagsChange,
  phaseId,
  onPhaseChange,
  phases,
  noneValue,
}: TaskAdvancedFieldsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-1.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        Advanced
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border px-3 pb-3 pt-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-tags">Tags</Label>
            <Input
              id="task-tags"
              value={tagsInput}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder="bug, feature, refactor (comma-separated)"
            />
          </div>

          {phases.length > 0 && (
            <div className="space-y-1.5">
              <Label>Phase</Label>
              <Select value={phaseId} onValueChange={onPhaseChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={noneValue}>None</SelectItem>
                  {phases.map((ph) => (
                    <SelectItem key={ph.id} value={ph.id}>
                      {ph.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
