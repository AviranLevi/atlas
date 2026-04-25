// FILE_PATH: packages/client/src/components/projects/create/CloneStub.tsx

// Components
import { Button } from '@/components/ui/button';

// Types
import type { ProjectCreateBodyProps } from '../projects.types';

export function CloneStub({ onCancel, hideCancel }: ProjectCreateBodyProps) {
  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4 text-sm">
      <p className="font-medium">Clone from Git — coming soon</p>
      <p className="text-muted-foreground text-xs">
        Atlas will let you paste a Git URL and clone it into an allowed parent folder. For now, clone the repo manually
        and use <strong>Pick existing</strong>.
      </p>
      {!hideCancel && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
