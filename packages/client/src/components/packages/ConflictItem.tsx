import { AlertTriangle, Check } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ConflictItemProps = {
  label: string;
  name: string;
  conflict: { id: string; name: string } | null;
  resolution?: { action: string; rename?: string };
  onResolutionChange: (r: { action: 'overwrite' | 'rename'; rename?: string }) => void;
};

export function ConflictItem({
  label,
  name,
  conflict,
  resolution,
  onResolutionChange,
}: ConflictItemProps) {
  if (!conflict) {
    return (
      <div className="flex items-center gap-2 rounded-lg border p-3">
        <Check className="h-4 w-4 text-green-500 shrink-0" />
        <span className="text-sm">{name}</span>
        <Badge variant="secondary" className="text-xs ml-auto">{label}</Badge>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-sm font-medium">{name}</span>
        <Badge variant="outline" className="text-xs ml-auto">{label}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        A {label.toLowerCase()} named &ldquo;{conflict.name}&rdquo; already exists.
      </p>
      <Select
        value={resolution?.action ?? 'rename'}
        onValueChange={(v) => {
          if (v === 'overwrite') {
            onResolutionChange({ action: 'overwrite' });
          } else {
            onResolutionChange({ action: 'rename', rename: resolution?.rename ?? `${name} (imported)` });
          }
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="overwrite">Overwrite existing</SelectItem>
          <SelectItem value="rename">Import with new name</SelectItem>
        </SelectContent>
      </Select>
      {(resolution?.action === 'rename' || !resolution) && (
        <Input
          value={resolution?.rename ?? `${name} (imported)`}
          onChange={(e) => onResolutionChange({ action: 'rename', rename: e.target.value })}
          className="h-8 text-xs"
          placeholder="New name..."
        />
      )}
    </div>
  );
}
