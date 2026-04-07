// React / library
import { FolderOpen, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectCard } from './components/ProjectCard';

// Hooks
import { useProjectsWithSummary, useDeleteProject } from '@/hooks/use-projects.hook';

// Types
import type { Project } from '@atlas/shared';
import type { ProjectWithSummary } from './projects.types';

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjectsWithSummary();
  const deleteProject = useDeleteProject();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleCreate = () => {
    setEditingProject(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, project: ProjectWithSummary) => {
    e.stopPropagation();
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this project and all its tasks, workspaces, memories, and phases? This cannot be undone.')) {
      deleteProject.mutate(id);
    }
  };

  const filtered = projects?.filter((p) => statusFilter === 'all' || p.status === statusFilter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Manage project configurations and agent assignments</p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-12 text-center text-sm">Loading...</div>
      ) : !filtered?.length ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FolderOpen className="text-muted-foreground mx-auto mb-4 h-10 w-10" />
          <h3 className="mb-1 text-base font-medium">No projects yet</h3>
          <p className="text-muted-foreground mb-4 text-sm">Create your first project to manage configurations.</p>
          <Button onClick={handleCreate} variant="outline" size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onNavigate={(id) => navigate(`/projects/${id}`)}
            />
          ))}
        </div>
      )}

      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editingProject} />
    </div>
  );
}
