// FILE_PATH: packages/client/src/components/projects/create/ScaffoldForm.tsx

// React / library
import { FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FolderPickerDialog } from '../FolderPickerDialog';
import { ColorPicker } from './ColorPicker';

// Hooks
import { useOpenProjectInEditor, useScaffoldProject } from '@/hooks/use-projects.hook';
import { useAutoOpenEditorPref } from './use-auto-open-editor-pref';

// Helpers
import { loadLastParent, saveLastParent } from './last-parent-storage';

// Types
import type { ProjectCreateBodyProps } from '../projects.types';

export function ScaffoldForm({ onCreated, onCancel, hideCancel }: ProjectCreateBodyProps) {
  const scaffold = useScaffoldProject();
  const openInEditor = useOpenProjectInEditor();
  const autoOpenEditor = useAutoOpenEditorPref();

  const [parentPath, setParentPath] = useState(() => loadLastParent());
  const [folderName, setFolderName] = useState('');
  // `projectName` mirrors the folder name until the user explicitly edits it. Using a
  // derived display value beats a useEffect autofill — fewer renders, no stale-deps lint.
  const [projectName, setProjectName] = useState('');
  const [initGit, setInitGit] = useState(true);
  const [initialBranch, setInitialBranch] = useState('main');
  const [color, setColor] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const displayedProjectName = projectName || folderName;

  const handlePicked = (p: string) => {
    setParentPath(p);
    saveLastParent(p);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = (projectName || folderName).trim();
    scaffold.mutate(
      {
        parentPath,
        folderName: folderName.trim(),
        projectName: finalName,
        initGit,
        initialBranch: initialBranch.trim() || 'main',
        color: color ?? null,
      },
      {
        onSuccess: (project) => {
          saveLastParent(parentPath);
          toast.success(`Created ${project.name}`);
          if (autoOpenEditor) openInEditor.mutate(project.id);
          onCreated?.(project);
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };

  const canSubmit = !!parentPath && !!folderName.trim() && !!displayedProjectName.trim() && !scaffold.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="parentPath">Parent folder</Label>
        <div className="flex gap-2">
          <Input
            id="parentPath"
            value={parentPath}
            readOnly
            placeholder="Pick where this folder will live..."
            onClick={() => setPickerOpen(true)}
            className="cursor-pointer text-xs"
          />
          <Button type="button" variant="outline" size="icon" onClick={() => setPickerOpen(true)}>
            <FolderOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="folderName">Folder name</Label>
          <Input
            id="folderName"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="my-app"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectName">Project name</Label>
          <Input
            id="projectName"
            value={displayedProjectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="My App"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="initGit" className="text-sm">Initialize git repository</Label>
          <p className="text-muted-foreground text-xs">
            Runs <code>git init</code> inside the new folder.
          </p>
        </div>
        <Switch id="initGit" checked={initGit} onCheckedChange={setInitGit} />
      </div>

      {initGit && (
        <div className="space-y-2">
          <Label htmlFor="initialBranch">Initial branch</Label>
          <Input
            id="initialBranch"
            value={initialBranch}
            onChange={(e) => setInitialBranch(e.target.value)}
            placeholder="main"
          />
        </div>
      )}

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
          {scaffold.isPending ? 'Creating...' : 'Create project'}
        </Button>
      </div>

      <FolderPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        initialPath={parentPath || undefined}
        onSelect={handlePicked}
      />
    </form>
  );
}
