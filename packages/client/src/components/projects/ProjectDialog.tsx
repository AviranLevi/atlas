// React / library
import { useEffect, useState, useCallback } from 'react';
import { FolderOpen, ScanSearch } from 'lucide-react';

// Components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderPickerDialog } from './FolderPickerDialog';

// Hooks
import { useCreateProject, useUpdateProject, useProjectBranches, useScanProject, useScanFolder } from '@/hooks/use-projects.hook';

// Types
import type { ProjectStatus } from '@atlas/shared';
import type { ProjectDialogProps } from './projects.types';

// Constants
import { STATUSES, COLOR_PRESETS } from './projects.constants';

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const scanProject = useScanProject();
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
    } else {
      setName('');
      setDescription('');
      setTechStack('');
      setStatus('active');
      setRepositoryUrl('');
      setLocalPath('');
      setDefaultBranch('');
      setColor(null);
      setScanned(false);
    }
  }, [project, open]);

  const doScan = useCallback((folderPath: string) => {
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
  }, [name, description, techStack, repositoryUrl, defaultBranch, scanFolder]);

  const handleFolderSelect = useCallback((selectedPath: string) => {
    setLocalPath(selectedPath);
    if (!isEditing) {
      doScan(selectedPath);
    }
  }, [isEditing, doScan]);

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
    };

    if (isEditing) {
      updateProject.mutate(
        { id: project.id, data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createProject.mutate(data, {
        onSuccess: (created) => {
          onOpenChange(false);
          if (data.localPath) {
            scanProject.mutate(created.id);
          }
        },
      });
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;
  const submitMutation = isEditing ? updateProject : createProject;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && !localPath && (
            <button
              type="button"
              onClick={() => setFolderPickerOpen(true)}
              className="w-full rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30 transition-colors p-6 flex flex-col items-center gap-2 text-center"
            >
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-sm">Select a project folder</p>
              <p className="text-muted-foreground text-xs">
                Pick your local git repository and we'll auto-fill the rest
              </p>
            </button>
          )}

          {(isEditing || localPath) && (
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
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
                    <Select
                      value={defaultBranch || ''}
                      onValueChange={(v) => setDefaultBranch(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch..." />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
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
            {(isEditing || localPath) && (
              <Button asChild>
                <button type="submit" disabled={isPending || !name.trim()}>
                  {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
                </button>
              </Button>
            )}
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
