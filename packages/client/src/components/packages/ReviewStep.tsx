// React / library
import { AlertTriangle, Check } from 'lucide-react';

// Components
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConflictItem } from './ConflictItem';

// Types
import type { AgentProvider, AtlasPackage } from '@atlas/shared';
import type { ImportPreviewData, Resolutions } from './packages.types';

type ReviewStepProps = {
  pkg: AtlasPackage;
  preview: ImportPreviewData;
  providers: AgentProvider[];
  resolutions: Resolutions;
  onResolutionsChange: (updater: (prev: Resolutions) => Resolutions) => void;
};

export function ReviewStep({ pkg, preview, providers, resolutions, onResolutionsChange }: ReviewStepProps) {
  const hasConflicts =
    preview.agent?.conflict || preview.skills.some((s) => s.conflict) || preview.rules.some((r) => r.conflict);

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
      <div className="rounded-lg border p-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{pkg.name}</span>
          <Badge variant="outline" className="text-xs">
            {pkg.type}
          </Badge>
        </div>
        {pkg.version && <span className="text-xs text-muted-foreground">v{pkg.version}</span>}
      </div>

      {preview.agent && (
        <ConflictItem
          label="Agent"
          name={(preview.agent.data as { name: string }).name}
          conflict={preview.agent.conflict}
          resolution={resolutions.agent}
          onResolutionChange={(r) => onResolutionsChange((prev) => ({ ...prev, agent: r }))}
        />
      )}

      {preview.skills.map((s, i) => (
        <ConflictItem
          key={`skill-${i}`}
          label="Skill"
          name={(s.data as { name: string }).name}
          conflict={s.conflict}
          resolution={resolutions.skills[(s.data as { name: string }).name]}
          onResolutionChange={(r) =>
            onResolutionsChange((prev) => ({
              ...prev,
              skills: { ...prev.skills, [(s.data as { name: string }).name]: r },
            }))
          }
        />
      ))}

      {preview.rules.map((r, i) => (
        <ConflictItem
          key={`rule-${i}`}
          label="Rule"
          name={(r.data as { name: string }).name}
          conflict={r.conflict}
          resolution={resolutions.rules[(r.data as { name: string }).name]}
          onResolutionChange={(res) =>
            onResolutionsChange((prev) => ({
              ...prev,
              rules: { ...prev.rules, [(r.data as { name: string }).name]: res },
            }))
          }
        />
      ))}

      {preview.providerHint && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Provider Required</span>
            <Badge variant="secondary" className="text-xs">
              {preview.providerHint.hint.type}
            </Badge>
          </div>
          {preview.providerHint.matchedProvider ? (
            <p className="text-xs text-muted-foreground">
              <Check className="mr-1 inline h-3 w-3 text-green-500" />
              Matched: {preview.providerHint.matchedProvider.name}
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-amber-600">
                <AlertTriangle className="mr-1 inline h-3 w-3" />
                No {preview.providerHint.hint.type} provider found.
              </p>
              {providers.length > 0 && (
                <Select
                  value={resolutions.providerId ?? ''}
                  onValueChange={(v) => onResolutionsChange((prev) => ({ ...prev, providerId: v || null }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      )}

      {!hasConflicts && (
        <p className="text-sm text-muted-foreground">
          <Check className="mr-1 inline h-4 w-4 text-green-500" />
          No conflicts detected. Ready to import.
        </p>
      )}
    </div>
  );
}
