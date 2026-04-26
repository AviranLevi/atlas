/** biome-ignore-all lint/a11y/useSemanticElements: button-styled radio pattern inside an ARIA radiogroup; <input type="radio"> would break the card layout. */
// FILE_PATH: packages/client/src/components/projects/ProjectCreateBody.tsx

// React / library
import { FolderOpen, FolderPlus, GitBranch } from 'lucide-react';
import { useState } from 'react';

// Components
import { CloneStub } from './create/CloneStub';
import { PickExistingForm } from './create/PickExistingForm';
import { ScaffoldForm } from './create/ScaffoldForm';

// Types
import type { Project } from '@atlas/shared';
import type { ProjectCreateBodyProps, ProjectCreateMode } from './projects.types';

const MODE_LABELS: Record<ProjectCreateMode, { title: string; description: string; icon: React.ElementType }> = {
  // Internal mode keys (`scaffold`, `existing`, `clone`) deliberately stay short — user-facing
  // labels live in the `title` / `description` strings below.
  scaffold: { title: 'Create new', description: 'Make a new folder and (optionally) git init', icon: FolderPlus },
  existing: { title: 'Pick existing', description: 'Use a folder that already lives on disk', icon: FolderOpen },
  clone: { title: 'Clone from Git', description: 'Coming soon', icon: GitBranch },
};

/**
 * Dispatcher for the three project-creation flows. Sub-forms (scaffold / pick-existing /
 * clone) live in their own files under `./create/` so this component stays focused on
 * mode selection.
 */
export function ProjectCreateBody({
  onCreated,
  onCancel,
  hideCancel,
  initialMode = 'scaffold',
}: ProjectCreateBodyProps) {
  const [mode, setMode] = useState<ProjectCreateMode>(initialMode);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="How to set up the project">
        {(Object.keys(MODE_LABELS) as ProjectCreateMode[]).map((m) => {
          const meta = MODE_LABELS[m];
          const Icon = meta.icon;
          const active = mode === m;
          const disabled = m === 'clone';
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={disabled || undefined}
              onClick={() => !disabled && setMode(m)}
              disabled={disabled}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? 'border-primary bg-primary/5'
                  : disabled
                    ? 'cursor-not-allowed border-dashed opacity-50'
                    : 'hover:border-foreground/30'
              }`}
            >
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div className="font-medium">{meta.title}</div>
              <div className="text-muted-foreground">{meta.description}</div>
            </button>
          );
        })}
      </div>

      {mode === 'scaffold' && <ScaffoldForm onCreated={onCreated} onCancel={onCancel} hideCancel={hideCancel} />}
      {mode === 'existing' && <PickExistingForm onCreated={onCreated} onCancel={onCancel} hideCancel={hideCancel} />}
      {mode === 'clone' && <CloneStub onCancel={onCancel} hideCancel={hideCancel} />}
    </div>
  );
}

export type { Project };
