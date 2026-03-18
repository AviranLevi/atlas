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
import { useCreateProject, useUpdateProject } from '@/hooks/use-projects.hook';
// Utils
import { api } from '@/lib/api';
// Types
import type { Project, ProjectStatus } from '@my-agents/shared';

type ScanResult = {
  name: string | null;
  description: string | null;
  techStack: string | null;
  repositoryUrl: string | null;
};

type ProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
};

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'archived', label: 'Archived' },
  { value: 'completed', label: 'Completed' },
];

const COLOR_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#64748b',
];

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const isEditing = !!project;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [color, setColor] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setTechStack(project.techStack ?? '');
      setStatus((project.status as ProjectStatus) ?? 'active');
      setRepositoryUrl(project.repositoryUrl ?? '');
      setLocalPath(project.localPath ?? '');
      setColor(project.color ?? null);
    } else {
      setName('');
      setDescription('');
      setTechStack('');
      setStatus('active');
      setRepositoryUrl('');
      setLocalPath('');
      setColor(null);
      setScanned(false);
    }
  }, [project, open]);

  const scanFolder = useCallback(async (folderPath: string) => {
    if (!folderPath) return;
    setScanning(true);
    try {
      const result = await api.get<ScanResult>(
        `/filesystem/scan?path=${encodeURIComponent(folderPath)}`,
      );
      if (result.name && !name) setName(result.name);
      if (result.description && !description) setDescription(result.description);
      if (result.techStack && !techStack) setTechStack(result.techStack);
      if (result.repositoryUrl && !repositoryUrl) setRepositoryUrl(result.repositoryUrl);
      setScanned(true);
    } catch {
      // scan is best-effort
    } finally {
      setScanning(false);
    }
  }, [name, description, techStack, repositoryUrl]);

  const handleFolderSelect = useCallback((selectedPath: string) => {
    setLocalPath(selectedPath);
    if (!isEditing) {
      scanFolder(selectedPath);
    }
  }, [isEditing, scanFolder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: name.trim(),
      description: description.trim() || null,
      techStack: techStack.trim() || null,
      status,
      repositoryUrl: repositoryUrl.trim() || null,
      localPath: localPath.trim() || null,
      color: color || null,
    };

    if (isEditing) {
      updateProject.mutate(
        { id: project.id, data },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createProject.mutate(data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const isPending = createProject.isPending || updateProject.isPending;

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
                        onClick={() => scanFolder(localPath)}
                        disabled={scanning}
                        title="Re-scan folder"
                      >
                        <ScanSearch className={`h-4 w-4 ${scanning ? 'animate-pulse' : ''}`} />
                      </button>
                    </Button>
                  )}
                </div>
                {(scanned || scanning) && (
                  <div className="flex items-center gap-2">
                    {scanned && (
                      <Badge variant="secondary" className="text-[10px]">
                        auto-filled from project
                      </Badge>
                    )}
                    {scanning && (
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
