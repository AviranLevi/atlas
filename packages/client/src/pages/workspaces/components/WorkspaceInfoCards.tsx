// React / library
import { GitBranch, Clock, Terminal, Cpu } from 'lucide-react';

// Components
import { Card } from '@/components/ui/card';

// Lib
import { calcDuration } from '@/lib/format';

// Types
import type { WorkspaceInfoCardsProps } from '../workspaces.types';

export function WorkspaceInfoCards({ workspace }: WorkspaceInfoCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <GitBranch className="h-3.5 w-3.5" />
          Branch
        </div>
        <p className="font-mono text-xs truncate" title={workspace.branchName}>
          {workspace.branchName}
        </p>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Clock className="h-3.5 w-3.5" />
          Duration
        </div>
        <p className="text-sm font-medium">{calcDuration(workspace.startedAt, workspace.completedAt)}</p>
      </Card>
      {workspace.model && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Cpu className="h-3.5 w-3.5" />
            Model
          </div>
          <p className="text-sm font-medium truncate" title={workspace.model}>
            {workspace.model}
          </p>
        </Card>
      )}
      {workspace.pid && (
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Terminal className="h-3.5 w-3.5" />
            PID
          </div>
          <p className="text-sm font-medium">{workspace.pid}</p>
        </Card>
      )}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Clock className="h-3.5 w-3.5" />
          Started
        </div>
        <p className="text-xs">{workspace.startedAt ? new Date(workspace.startedAt).toLocaleString() : '—'}</p>
      </Card>
    </div>
  );
}
