import { useState } from 'react';
import type { Project } from '@my-agents/shared';
import { FolderOpen, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProjects, useDeleteProject } from '@/hooks/use-projects.hook';
import { ProjectDialog } from '@/components/projects/ProjectDialog';

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  const handleCreate = () => {
    setEditingProject(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this project?')) {
      deleteProject.mutate(id);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Manage project configurations and agent assignments
          </p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">Loading...</div>
      ) : !projects?.length ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FolderOpen className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
          <h3 className="mb-1 text-base font-medium">No projects yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Create your first project to manage configurations.
          </p>
          <Button onClick={handleCreate} variant="outline" size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group relative flex flex-col gap-2 p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                  <FolderOpen className="text-primary h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">{project.name}</h3>
                  {project.description && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              {project.techStack && (
                <div className="flex flex-wrap gap-1">
                  {project.techStack
                    .split(',')
                    .map((tech) => tech.trim())
                    .filter(Boolean)
                    .map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-[11px]">
                        {tech}
                      </Badge>
                    ))}
                </div>
              )}

              <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(project)} aria-label="Edit project">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(project.id)} aria-label="Delete project">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editingProject}
      />
    </div>
  );
}
