import { useEffect, useState } from 'react';
import type { Project } from '@my-agents/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProject, useUpdateProject } from '@/hooks/use-projects.hook';

type ProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
};

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const isEditing = !!project;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
      setTechStack(project.techStack ?? '');
    } else {
      setName('');
      setDescription('');
      setTechStack('');
    }
  }, [project, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: name.trim(),
      description: description.trim() || null,
      techStack: techStack.trim() || null,
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="techStack">Tech Stack</Label>
            <Input
              id="techStack"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="React, TypeScript, Node.js"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" asChild>
              <button type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </button>
            </Button>
            <Button asChild>
              <button type="submit" disabled={isPending || !name.trim()}>
                {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
              </button>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
