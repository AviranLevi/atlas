// React / library
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';

// Types
import type { Workspace } from '@atlas/shared';

const STAGE_COLORS: Record<string, string> = {
  brainstorm: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  plan: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  execute: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'border-green-300 dark:border-green-700',
  running: 'border-blue-300 dark:border-blue-700',
  failed: 'border-red-300 dark:border-red-700',
};

type WorkspaceLineageProps = {
  lineage: Workspace[];
  currentId: string;
};

export function WorkspaceLineage({ lineage, currentId }: WorkspaceLineageProps) {
  if (lineage.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {lineage.map((ws, i) => (
        <div key={ws.id} className="flex items-center gap-1">
          {i > 0 && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          {ws.id === currentId ? (
            <Badge
              variant="outline"
              className={`shrink-0 font-medium ${STATUS_COLORS[ws.status] ?? ''} ${STAGE_COLORS[ws.workflowStage ?? ''] ?? ''}`}
            >
              {ws.workflowStage ?? 'execute'}
            </Badge>
          ) : (
            <Link to={`/workspaces/${ws.id}`}>
              <Badge
                variant="outline"
                className={`shrink-0 cursor-pointer hover:bg-accent ${STAGE_COLORS[ws.workflowStage ?? ''] ?? ''}`}
              >
                {ws.workflowStage ?? 'execute'}
              </Badge>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
