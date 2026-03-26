// React / library
import { Pencil, Trash2 } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Types
import type { PhaseStatus } from '@atlas/shared';
import type { PhaseCardProps } from './phases.types';

// Constants
import { STATUS_LABELS, STATUS_COLORS } from './phases.constants';

export function PhaseCard({ phase, onEdit, onDelete }: PhaseCardProps) {
  const total = phase.taskCount ?? 0;
  const done = phase.doneCount ?? 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const status = phase.status as PhaseStatus;

  return (
    <div className="group rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate">{phase.name}</span>
            <Badge
              variant="outline"
              className={`text-xs shrink-0 ${STATUS_COLORS[status] ?? ''}`}
            >
              {STATUS_LABELS[status] ?? status}
            </Badge>
          </div>
          {phase.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {phase.description}
            </p>
          )}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {done}/{total} tasks done
              </span>
              <span>{percent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(phase)}
            aria-label="Edit phase"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(phase.id)}
            aria-label="Delete phase"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
