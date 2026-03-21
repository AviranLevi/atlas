// React / library
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Pencil, Trash2, Users } from 'lucide-react';
// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
// Hooks
import { useProjectsWithSummary, useDeleteProject } from '@/hooks/use-projects.hook';
// Types
import type { Project, ProjectStatus } from '@my-agents/shared';
import type { ProjectWithSummary } from '@/hooks/use-projects.hook';
import { timeAgo } from '@/lib/format';
import { statusConfig } from './projects-page.constants';

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
    if (confirm('Delete this project?')) {
      deleteProject.mutate(id);
    }
  };

  const filtered = projects?.filter(
    (p) => statusFilter === 'all' || p.status === statusFilter,
  );

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
          {filtered.map((project) => {
            const status = statusConfig[project.status as ProjectStatus] ?? statusConfig.active;
            const { taskCounts, agentCount } = project;
            const doneRatio = taskCounts.total > 0
              ? Math.round((taskCounts.done / taskCounts.total) * 100)
              : 0;

            return (
              <Card
                key={project.id}
                className="group relative flex cursor-pointer flex-col gap-2 p-4 transition-shadow hover:shadow-md"
                style={{ borderLeftWidth: 3, borderLeftColor: project.color ?? 'transparent' }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold">{project.name}</h3>
                    {project.description && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[10px] ${status.className}`}>
                    {status.label}
                  </Badge>
                </div>

                {project.techStack && (
                  <div className="flex flex-wrap gap-1">
                    {project.techStack
                      .split(',')
                      .map((tech) => tech.trim())
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-[10px]">
                          {tech}
                        </Badge>
                      ))}
                  </div>
                )}

                {/* Progress + meta */}
                <div className="mt-auto flex flex-col gap-1.5 pt-1">
                  {taskCounts.total > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-green-500 transition-all"
                          style={{ width: `${doneRatio}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground shrink-0 text-[10px]">
                        {taskCounts.done}/{taskCounts.total}
                      </span>
                    </div>
                  )}
                  <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {agentCount} agent{agentCount !== 1 ? 's' : ''}
                    </span>
                    <span>{timeAgo(project.updatedAt)}</span>
                  </div>
                </div>

                <div className="absolute right-2 top-2 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleEdit(e, project)}
                    aria-label="Edit project"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => handleDelete(e, project.id)}
                    aria-label="Delete project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
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
