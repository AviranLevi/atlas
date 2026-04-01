// React / library
import { Terminal } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceCard } from './WorkspaceCard';

// Hooks
import { useWorkspaces } from '@/hooks/use-workspaces.hook';

export function WorkspaceStatusPanel() {
  const { data: workspaces = [], isLoading } = useWorkspaces();

  const active = workspaces.filter((w) => w.status === 'running' || w.status === 'pending');
  const recent = workspaces.filter((w) => w.status !== 'running' && w.status !== 'pending').slice(0, 5);

  if (isLoading || workspaces.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          Agent Workspaces
          {active.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {active.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {active.map((ws) => (
          <WorkspaceCard key={ws.id} workspace={ws} />
        ))}
        {recent.length > 0 && active.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <p className="text-muted-foreground text-[10px] mb-1.5">Recent</p>
          </div>
        )}
        {recent.map((ws) => (
          <WorkspaceCard key={ws.id} workspace={ws} />
        ))}
      </CardContent>
    </Card>
  );
}
