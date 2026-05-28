// React / library
import { FolderOpen, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Components
import { EmptyState } from '@/components/empty-state/EmptyState';
import { ProjectCreateDialog } from '@/components/projects/ProjectCreateDialog';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectCard } from './components/ProjectCard';

// Hooks
import { useDeleteProject, useProjectsWithSummary } from '@/hooks/use-projects.hook';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Lib
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

// Types
import type { Project } from '@atlas/shared';
import type { ProjectWithSummary } from './projects.types';

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjectsWithSummary();
  const deleteProject = useDeleteProject();
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const { setActiveProjectId } = useActiveProject();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const handleCreate = () => {
    setCreateDialogOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, project: ProjectWithSummary) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditDialogOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteProjectId(id);
  };

  const handleOpen = (id: string) => {
    setActiveProjectId(id);
    navigate(`/projects/${id}`);
  };

  const filtered = useMemo(() => {
    if (!projects) return undefined;
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [p.name, p.description, p.techStack, p.localPath, p.defaultBranch]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [projects, statusFilter, search]);

  const total = projects?.length ?? 0;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Projects</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {total === 0
              ? 'Create or pick a project to get started.'
              : `${total} project${total === 1 ? '' : 's'} — pick one to open or manage.`}
          </p>
        </div>
        <Button onClick={handleCreate} size="sm" data-tour={TOUR_TARGETS.projectsNewBtn}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Project
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center" data-tour={TOUR_TARGETS.projectsFilter}>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, path, or tech..."
            className="h-8 pl-8 text-xs"
          />
        </div>
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
      ) : !projects?.length ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          body="Create your first project to start tracking tasks and running agents."
          primaryCta={{ label: 'Create your first project', onClick: handleCreate, icon: Plus }}
        />
      ) : !filtered?.length ? (
        <EmptyState
          icon={Search}
          title="No projects match your filter"
          body="Try clearing the search or status filter."
          compact
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onNavigate={handleOpen}
            />
          ))}
        </div>
      )}

      <ProjectCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={(p) => handleOpen(p.id)}
      />
      <ProjectDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} project={editingProject} />

      <ConfirmDeleteDialog
        open={!!deleteProjectId}
        onOpenChange={(open) => !open && setDeleteProjectId(null)}
        title="Delete project"
        description="This will permanently delete the project and all its tasks, workspaces, memories, and phases. This action cannot be undone."
        isPending={deleteProject.isPending}
        onConfirm={() => {
          if (deleteProjectId) {
            deleteProject.mutate(deleteProjectId, { onSuccess: () => setDeleteProjectId(null) });
          }
        }}
      />
    </div>
  );
}
