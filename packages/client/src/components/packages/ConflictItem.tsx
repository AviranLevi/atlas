// React / library
import { AlertTriangle, Check } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types
import type { ImportResolution } from '@atlas/shared';

type ConflictItemProps = {
  label: string;
  hasConflict: boolean;
  resolution: ImportResolution;
  onResolutionChange: (r: ImportResolution) => void;
};

export function ConflictItem({ label, hasConflict, resolution, onResolutionChange }: ConflictItemProps) {
  if (!hasConflict) {
    return (
      <div className="flex items-center gap-2 rounded-lg border p-3">
        <Check className="h-4 w-4 shrink-0 text-green-500" />
        <span className="text-sm">{resolution.name}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {label}
        </Badge>
      </div>
    );
  }

  const defaultRenamed = resolution.renamedTo ?? `${resolution.name}-imported`;

  return (
    <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
        <span className="text-sm font-medium">{resolution.name}</span>
        <Badge variant="outline" className="ml-auto text-xs">
          {label}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        A {label.toLowerCase()} with this name already exists. Skip it or import under a new name.
      </p>
      <Select
        value={resolution.action}
        onValueChange={(v) => {
          const action = v as ImportResolution['action'];
          if (action === 'skip') {
            onResolutionChange({ name: resolution.name, action: 'skip' });
          } else if (action === 'rename') {
            onResolutionChange({
              name: resolution.name,
              action: 'rename',
              renamedTo: resolution.renamedTo ?? defaultRenamed,
            });
          } else {
            onResolutionChange({ name: resolution.name, action: 'create' });
          }
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="rename">Import with new name</SelectItem>
          <SelectItem value="skip">Skip</SelectItem>
        </SelectContent>
      </Select>
      {resolution.action === 'rename' && (
        <Input
          value={resolution.renamedTo ?? defaultRenamed}
          onChange={(e) => onResolutionChange({ name: resolution.name, action: 'rename', renamedTo: e.target.value })}
          className="h-8 text-xs"
          placeholder="New name..."
        />
      )}
    </div>
  );
}
