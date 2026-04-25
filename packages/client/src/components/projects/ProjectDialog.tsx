// React / library
import { FolderOpen, ScanSearch } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FolderPickerDialog } from './FolderPickerDialog';

// Hooks
import { useProjectBranches, useScanFolder, useUpdateProject } from '@/hooks/use-projects.hook';

// Types
import type { ProjectStatus } from '@atlas/shared';
import type { ProjectDialogProps } from './projects.types';

// Constants
import { COLOR_PRESETS, STATUSES } from './projects.constants';

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
  // ProjectDialog is now edit-only — creation flows live in ProjectCreateDialog.
  const updateProject = useUpdateProject();
  const scanFolder = useScanFolder();
  const isEditing = !!project;
  const { data: branches = [] } = useProjectBranches(isEditing ? project?.id : undefined);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('');
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [color, setColor] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [mission, setMission] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setTechStack(project.techStack ?? '');
      setStatus((project.status as ProjectStatus) ?? 'active');
      setRepositoryUrl(project.repositoryUrl ?? '');
      setLocalPath(project.localPath ?? '');
      setDefaultBranch(project.defaultBranch ?? '');
      setColor(project.color ?? null);
      setMission(project.mission ?? '');
    } else {
      setName('');
      setDescription('');
      setTechStack('');
      setStatus('active');
      setRepositoryUrl('');
      setLocalPath('');
      setDefaultBranch('');
      setColor(null);
      setMission('');
      setScanned(false);
    }
  }, [project]);

  const doScan = useCallback(
    (folderPath: string) => {
      if (!folderPath) return;
      scanFolder.mutate(folderPath, {
        onSuccess: (result) => {
          if (result.name && !name) setName(result.name);
          if (result.description && !description) setDescription(result.description);
          if (result.techStack && !techStack) setTechStack(result.techStack);
          if (result.repositoryUrl && !repositoryUrl) setRepositoryUrl(result.repositoryUrl);
          if (result.defaultBranch && !defaultBranch) setDefaultBranch(result.defaultBranch);
          setScanned(true);
        },
      });
    },
    [name, description, techStack, repositoryUrl, defaultBranch, scanFolder],
  );

  const handleFolderSelect = useCallback(
    (selectedPath: string) => {
      setLocalPath(selectedPath);
      if (!isEditing) {
        doScan(selectedPath);
      }
    },
    [isEditing, doScan],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: name.trim(),
      description: description.trim() || null,
      techStack: techStack.trim() || null,
      status,
      repositoryUrl: repositoryUrl.trim() || null,
      localPath: localPath.trim() || null,
      defaultBranch: defaultBranch.trim() || null,
      color: color || null,
      mission: mission.trim() || null,
    };

    if (isEditing) {
      updateProject.mutate({ id: project.id, data }, { onSuccess: () => onOpenChange(false) });
    } else {
      // Defensive: this dialog is edit-only. Callers should use ProjectCreateDialog instead.
      onOpenChange(false);
    }
  };

  const isPending = updateProject.isPending;
  const submitMutation = updateProject;

  if (!isEditing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {(
            <>
              <div className="space-y-2">
                <Label>Local Path</Label>
                <div className="flex gap-2">
                  <Input
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="Select a folder..."
                    readOnly
                    className="cursor-pointer text-xs"
                    onClick={() => setFolderPickerOpen(true)}
                  />
                  <Button variant="outline" size="icon" className="shrink-0" asChild>
                    <button type="button" onClick={() => setFolderPickerOpen(true)}>
                      <FolderOpen className="h-4 w-4" />
                    </button>
                  </Button>
                  {localPath && (
                    <Button variant="outline" size="icon" className="shrink-0" asChild>
                      <button
                        type="button"
                        onClick={() => doScan(localPath)}
                        disabled={scanFolder.isPending}
                        title="Re-scan folder"
                      >
                        <ScanSearch className={`h-4 w-4 ${scanFolder.isPending ? 'animate-pulse' : ''}`} />
                      </button>
                    </Button>
                  )}
                </div>
                {(scanned || scanFolder.isPending) && (
                  <div className="flex items-center gap-2">
                    {scanned && (
                      <Badge variant="secondary" className="text-[10px]">
                        auto-filled from project
                      </Badge>
                    )}
                    {scanFolder.isPending && (
                      <Badge variant="secondary" className="text-[10px] animate-pulse">
                        scanning...
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Web App"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the project"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mission">Mission</Label>
                <Textarea
                  id="mission"
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="What is this project's north-star objective?"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="techStack">Tech Stack</Label>
                  <Input
                    id="techStack"
                    value={techStack}
                    onChange={(e) => setTechStack(e.target.value)}
                    placeholder="React, TypeScript, Node.js"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repositoryUrl">Repository URL</Label>
                  <Input
                    id="repositoryUrl"
                    value={repositoryUrl}
                    onChange={(e) => setRepositoryUrl(e.target.value)}
                    placeholder="https://github.com/user/repo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultBranch">Default Branch</Label>
                  {branches.length > 0 ? (
                    <Select value={defaultBranch || ''} onValueChange={(v) => setDefaultBranch(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch..." />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="defaultBranch"
                      value={defaultBranch}
                      onChange={(e) => setDefaultBranch(e.target.value)}
                      placeholder="main"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        color === c ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(color === c ? null : c)}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" asChild>
              <button type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </button>
            </Button>
            <Button asChild>
              <button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </Button>
            {submitMutation.isError && (
              <p className="text-sm text-destructive">{(submitMutation.error as Error).message}</p>
            )}
          </div>

          <FolderPickerDialog
            open={folderPickerOpen}
            onOpenChange={setFolderPickerOpen}
            initialPath={localPath || undefined}
            onSelect={handleFolderSelect}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
