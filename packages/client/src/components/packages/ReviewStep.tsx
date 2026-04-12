// React / library
import { Check } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { ConflictItem } from './ConflictItem';

// Types
import type { AtlasPackage, ImportPreview, ImportPreviewItem, ImportResolution } from '@atlas/shared';
import type { Resolutions } from './packages.types';

type ReviewStepProps = {
  pkg: AtlasPackage;
  preview: ImportPreview;
  resolutions: Resolutions;
  onResolutionAtIndexChange: (index: number, r: ImportResolution) => void;
};

function previewLabel(item: ImportPreviewItem): string {
  if (item.type === 'skill') return 'Skill';
  if (item.type === 'rule') return 'Rule';
  if (item.type === 'agent') return 'Agent';
  return 'Collection item';
}

export function ReviewStep({ pkg, preview, resolutions, onResolutionAtIndexChange }: ReviewStepProps) {
  const hasRowConflict = (item: ImportPreviewItem) => item.action !== 'create';

  return (
    <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
      <div className="space-y-1 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{pkg.metadata.name}</span>
          <Badge variant="outline" className="text-xs">
            {pkg.type}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">v{pkg.metadata.version}</span>
      </div>

      {preview.items.map((item, index) => (
        <ConflictItem
          // biome-ignore lint/suspicious/noArrayIndexKey: server preview row order is stable; type+name may repeat in malformed packages
          key={`${item.type}-${item.name}-${index}`}
          label={previewLabel(item)}
          hasConflict={hasRowConflict(item)}
          resolution={resolutions[index]!}
          onResolutionChange={(r) => onResolutionAtIndexChange(index, r)}
        />
      ))}

      {!preview.hasConflicts && (
        <p className="text-sm text-muted-foreground">
          <Check className="mr-1 inline h-4 w-4 text-green-500" />
          No conflicts detected. Ready to import.
        </p>
      )}
    </div>
  );
}
