// React / library
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Users,
  ListChecks,
  Brain,
  Milestone,
  Plus,
} from 'lucide-react';
// Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { PhaseCard } from '@/components/phases/PhaseCard';
import { PhaseDialog } from '@/components/phases/PhaseDialog';
// Hooks
import { useProjectContext } from '@/hooks/use-projects.hook';
import { usePhases, useDeletePhase } from '@/hooks/use-phases.hook';
// Types
import type { ProjectStatus, Task, Phase } from '@my-agents/shared';
// Constants & utilities
import { statusConfig, taskStatusConfig, priorityBadgeClass } from './project-detail-page.constants';
import { timeAgo } from '@/lib/format';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ctx, isLoading } = useProjectContext(id);
  const { data: phases = [] } = usePhases(id ?? '');
  const deletePhase = useDeletePhase();
  const [editOpen, setEditOpen] = useState(false);
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | undefined>();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading project...</p>
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2">
        <p className="text-muted-foreground text-sm">Project not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const { project, agents, tasks, memories } = ctx;
  const status = statusConfig[project.status as ProjectStatus] ?? statusConfig.active;

  const tasksByStatus = tasks.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const statCards = [
    { label: 'To Do', count: tasksByStatus['To Do'] ?? 0, color: 'text-muted-foreground' },
    { label: 'In Progress', count: tasksByStatus['In Progress'] ?? 0, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'In Review', count: tasksByStatus['In Review'] ?? 0, color: 'text-yellow-600 dark:text-yellow-400' },
    { label: 'Done', count: tasksByStatus['Done'] ?? 0, color: 'text-green-600 dark:text-green-400' },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          onClick={() => navigate('/projects')}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Projects
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {project.color && (
              <div
                className="mt-1.5 h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </div>
              {project.description && (
                <p className="text-muted-foreground mt-1 text-sm">{project.description}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {project.techStack
                  ?.split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                {project.repositoryUrl && (
                  <a
                    href={project.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Repository
                  </a>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="flex flex-col items-center gap-1 p-4">
            <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
            <span className="text-muted-foreground text-xs">{s.label}</span>
          </Card>
        ))}
      </div>

      {/* Assigned Agents */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Users className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold">Assigned Agents ({agents.length})</h2>
        </div>
        {agents.length === 0 ? (
          <p className="text-muted-foreground text-xs">No agents assigned to this project yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {agents.map((agent) => (
              <Card key={agent.id} className="flex items-center gap-2 px-3 py-2">
                <div className="bg-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{agent.name}</p>
                  {agent.description && (
                    <p className="text-muted-foreground truncate text-xs">{agent.description}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Phases */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Milestone className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold">Phases ({phases.length})</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setEditingPhase(undefined); setPhaseDialogOpen(true); }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Phase
          </Button>
        </div>
        {phases.length === 0 ? (
          <p className="text-muted-foreground text-xs">No phases defined yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                onEdit={(p) => { setEditingPhase(p); setPhaseDialogOpen(true); }}
                onDelete={(phaseId) => {
                  if (confirm('Delete this phase? Tasks in this phase will be unassigned.')) {
                    deletePhase.mutate(phaseId);
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Tasks */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="text-muted-foreground h-4 w-4" />
            <h2 className="text-sm font-semibold">Tasks ({tasks.length})</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/kanban?projectId=${project.id}`)}
          >
            Open in Kanban
          </Button>
        </div>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-xs">No tasks for this project yet.</p>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Priority</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Estimate</th>
                  <th className="hidden px-3 py-2 font-medium lg:table-cell">Tags</th>
                  <th className="px-3 py-2 text-right font-medium">Age</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: Task) => {
                  const ts = taskStatusConfig[task.status];
                  return (
                    <tr key={task.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="max-w-[240px] truncate px-3 py-2 font-medium">{task.name}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 text-xs ${ts?.className ?? ''}`}>
                          {ts?.icon}
                          {task.status}
                        </span>
                      </td>
                      <td className="hidden px-3 py-2 sm:table-cell">
                        <Badge variant="outline" className={`text-xs ${priorityBadgeClass[task.priority] ?? ''}`}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="hidden px-3 py-2 md:table-cell">
                        <Badge variant="outline" className="text-xs">{task.estimate}</Badge>
                      </td>
                      <td className="hidden px-3 py-2 lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {task.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="text-muted-foreground px-3 py-2 text-right text-xs">
                        {timeAgo(task.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Memories */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Brain className="text-muted-foreground h-4 w-4" />
          <h2 className="text-sm font-semibold">Memories ({memories.length})</h2>
        </div>
        {memories.length === 0 ? (
          <p className="text-muted-foreground text-xs">No memories recorded for this project yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {memories.map((mem) => (
              <Card key={mem.id as string} className="p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{String(mem.scope ?? 'project')}</Badge>
                  <span className="text-muted-foreground text-xs">{timeAgo(String(mem.createdAt))}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm">{String(mem.content ?? '')}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <ProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />
      <PhaseDialog
        open={phaseDialogOpen}
        onOpenChange={setPhaseDialogOpen}
        projectId={project.id}
        phase={editingPhase}
      />
    </div>
  );
}
