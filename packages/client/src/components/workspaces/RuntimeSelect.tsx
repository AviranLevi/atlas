// Components
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types
import type { RuntimeSelectProps } from './workspaces.types';

export function RuntimeSelect({ runtimes, isLoading, value, onChange }: RuntimeSelectProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Agent Runtime</Label>
        <p className="text-muted-foreground text-sm">Loading runtimes...</p>
      </div>
    );
  }

  const sorted = [...runtimes].sort((a, b) => {
    const score = (r: typeof a) => (r.installed && r.authenticated ? 2 : r.installed ? 1 : 0);
    return score(b) - score(a);
  });

  return (
    <div className="space-y-2">
      <Label>Agent Runtime</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a runtime..." />
        </SelectTrigger>
        <SelectContent>
          {sorted.map((rt) => (
            <SelectItem key={rt.id} value={rt.id} disabled={!rt.installed || !rt.authenticated}>
              <div className="flex items-center gap-2">
                <span>{rt.name}</span>
                {!rt.installed && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Not installed
                  </Badge>
                )}
                {rt.installed && !rt.authenticated && (
                  <Badge variant="outline" className="text-[10px] border-yellow-300 text-yellow-600 dark:border-yellow-700 dark:text-yellow-400">
                    {rt.authHint ?? 'Not authenticated'}
                  </Badge>
                )}
                {rt.mcpConfigFormat !== 'none' && rt.installed && rt.authenticated && (
                  <Badge variant="secondary" className="text-[10px]">MCP</Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
