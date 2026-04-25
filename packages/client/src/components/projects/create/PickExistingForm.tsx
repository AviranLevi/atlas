// FILE_PATH: packages/client/src/components/projects/create/PickExistingForm.tsx

// React / library
import { FolderOpen } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderPickerDialog } from '../FolderPickerDialog';
import { ColorPicker } from './ColorPicker';

// Hooks
import { useCreateProject, useOpenProjectInEditor, useScanFolder } from '@/hooks/use-projects.hook';
import { useAutoOpenEditorPref } from './use-auto-open-editor-pref';

// Types
import type { ProjectCreateBodyProps } from '../projects.types';

export function PickExistingForm({ onCreated, onCancel, hideCancel }: ProjectCreateBodyProps) {
  const create = useCreateProject();
  const scan = useScanFolder();
  const openInEditor = useOpenProjectInEditor();
  const autoOpenEditor = useAutoOpenEditorPref();

  const [localPath, setLocalPath] = useState('');
  const [name, setName] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const runScan = useCallback(
    (p: string) => {
      if (!p) return;
      scan.mutate(p, {
        onSuccess: (result) => {
          if (result.name && !name) setName(result.name);
          if (result.defaultBranch && !defaultBranch) setDefaultBranch(result.defaultBranch);
        },
      });
    },
    [name, defaultBranch, scan],
  );

  const handlePicked = (p: string) => {
    setLocalPath(p);
    runScan(p);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        name: name.trim(),
        localPath: localPath.trim(),
        defaultBranch: defaultBranch.trim() || null,
        color: color ?? null,
        status: 'active',
      },
      {
        onSuccess: (project) => {
          toast.success(`Imported ${project.name}`);
          if (autoOpenEditor) openInEditor.mutate(project.id);
          onCreated?.(project);
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  const canSubmit = !!localPath && !!name.trim() && !create.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="localPath">Project folder</Label>
        <div className="flex gap-2">
          <Input
            id="localPath"
            value={localPath}
            readOnly
            placeholder="Pick an existing folder..."
            onClick={() => setPickerOpen(true)}
            className="cursor-pointer text-xs"
          />
          <Button type="button" variant="outline" size="icon" onClick={() => setPickerOpen(true)}>
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
        {scan.isPending && <p className="text-muted-foreground text-xs">Scanning...</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="exName">Project name</Label>
          <Input
            id="exName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My App"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exBranch">Default branch</Label>
          <Input
            id="exBranch"
            value={defaultBranch}
            onChange={(e) => setDefaultBranch(e.target.value)}
            placeholder="main"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <ColorPicker color={color} onChange={setColor} />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {!hideCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!canSubmit}>
          {create.isPending ? 'Importing...' : 'Import project'}
        </Button>
      </div>

      <FolderPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        initialPath={localPath || undefined}
        onSelect={handlePicked}
      />
    </form>
  );
}
