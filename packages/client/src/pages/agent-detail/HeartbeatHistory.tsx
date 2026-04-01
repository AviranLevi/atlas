// React / library
import { History } from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import { Badge } from '@/components/ui/badge';

// Lib
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';

// Types
import type { HeartbeatRun } from '@atlas/shared';

// Constants
import { formatResult, statusBadgeClass } from './heartbeat-section.constants';

type HeartbeatHistoryProps = {
  runs: HeartbeatRun[];
  isLoading: boolean;
};

export function HeartbeatHistory({ runs, isLoading }: HeartbeatHistoryProps) {
  return (
    <div className="space-y-2 border-t pt-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <History className="h-4 w-4" />
        Recent runs
      </div>
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading history…</p>
      ) : runs.length === 0 ? (
        <p className="text-muted-foreground text-sm">No runs yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b text-left">
                <th className="p-2 font-medium">Time</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium">Result</th>
                <th className="p-2 font-medium">Workspace</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b last:border-0">
                  <td className="text-muted-foreground p-2 whitespace-nowrap">
                    <span title={new Date(run.triggeredAt).toLocaleString()}>{timeAgo(run.triggeredAt)}</span>
                  </td>
                  <td className="p-2">
                    <Badge variant="outline" className={cn('text-xs capitalize', statusBadgeClass(run.status))}>
                      {run.status}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground p-2 capitalize">{formatResult(run.result)}</td>
                  <td className="p-2">
                    {run.workspaceId ? (
                      <Link
                        to={`/workspaces/${run.workspaceId}`}
                        className="text-primary font-medium underline-offset-4 hover:underline"
                      >
                        Open
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
