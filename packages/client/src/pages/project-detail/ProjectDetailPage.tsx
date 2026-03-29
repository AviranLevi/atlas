// React / library
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanSearch, Plus, Milestone } from 'lucide-react';

// Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { PhaseCard } from '@/components/phases/PhaseCard';
import { PhaseDialog } from '@/components/phases/PhaseDialog';
import { ProjectHeader } from './ProjectHeader';
import { ScanDataSection } from './ScanDataSection';
import { ProjectBriefSection } from './ProjectBriefSection';
import { ProjectAgentsSection } from './ProjectAgentsSection';
import { ProjectTasksTable } from './ProjectTasksTable';
import { ProjectMemoriesSection } from './ProjectMemoriesSection';

// Hooks
import { useProjectContext, useScanProject, useGenerateBrief } from '@/hooks/use-projects.hook';
import { usePhases, useDeletePhase } from '@/hooks/use-phases.hook';
import { useProjectAgents, useAssignAgent, useUnassignAgent } from '@/hooks/use-project-agents.hook';
import { useAgents } from '@/hooks/use-agents.hook';

// Types
import type { ProjectStatus, Phase } from '@atlas/shared';

// Constants
import { statusConfig } from './project-detail-page.constants';
import { timeAgo } from '@/lib/format';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ctx, isLoading } = useProjectContext(id);
  const { data: phases = [] } = usePhases(id ?? '');
  const deletePhase = useDeletePhase();
  const scanProject = useScanProject();
  const generateBrief = useGenerateBrief();
  const [editOpen, setEditOpen] = useState(false);
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | undefined>();
  const [assignPopoverOpen, setAssignPopoverOpen] = useState(false);

  const { data: projectAgents = [] } = useProjectAgents(id ?? '');
  const { data: allAgents = [] } = useAgents();
  const assignAgent = useAssignAgent();
  const unassignAgent = useUnassignAgent();

  const unassignedAgents = useMemo(() => {
    const assignedIds = new Set(projectAgents.map((a) => a.id));
    return allAgents.filter((a) => !assignedIds.has(a.id));
  }, [projectAgents, allAgents]);

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

  const { project, tasks, memories } = ctx;
  const status = statusConfig[project.status as ProjectStatus] ?? statusConfig.active;

  const tasksByStatus = tasks.reduce(
    (acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; },
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
      <ProjectHeader
        project={project}
        statusConfig={status}
        scanProject={scanProject}
        onEdit={() => setEditOpen(true)}
      />

      {/* Scan Data */}
      {project.scanData ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanSearch className="text-muted-foreground h-4 w-4" />
              <h2 className="text-sm font-semibold">Project Intelligence</h2>
            </div>
            {project.scanData.scannedAt && (
              <span className="text-muted-foreground text-xs">
                Scanned {timeAgo(project.scanData.scannedAt)}
              </span>
            )}
          </div>
          <ScanDataSection scanData={project.scanData} />
        </section>
      ) : project.localPath ? (
        <Card className="flex flex-col items-center gap-3 p-8 border-dashed">
          <ScanSearch className="h-8 w-8 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium text-sm">No project scan data yet</p>
            <p className="text-muted-foreground text-xs mt-1">
              Scan your project to detect tech stack, dependencies, directory structure, and more.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <button
              type="button"
              onClick={() => scanProject.mutate(project.id)}
              disabled={scanProject.isPending}
            >
              <ScanSearch className={`mr-1.5 h-4 w-4 ${scanProject.isPending ? 'animate-pulse' : ''}`} />
              {scanProject.isPending ? 'Scanning...' : 'Scan Project'}
            </button>
          </Button>
        </Card>
      ) : null}

      <ProjectBriefSection project={project} generateBrief={generateBrief} />

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label} className="flex flex-col items-center gap-1 p-4">
            <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
            <span className="text-muted-foreground text-xs">{s.label}</span>
          </Card>
        ))}
      </div>

      <ProjectAgentsSection
        projectId={project.id}
        projectAgents={projectAgents}
        unassignedAgents={unassignedAgents}
        assignPopoverOpen={assignPopoverOpen}
        onAssignPopoverOpenChange={setAssignPopoverOpen}
        onAssign={(agentId) => assignAgent.mutate({ projectId: project.id, agentId })}
        onUnassign={(agentId) => unassignAgent.mutate({ projectId: project.id, agentId })}
      />

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
          <div className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-5 text-muted-foreground">
            <Milestone className="h-5 w-5 shrink-0 opacity-50" />
            <div>
              <p className="text-xs font-medium">No phases defined</p>
              <p className="text-xs opacity-70">Break the project into phases to track progress milestones.</p>
            </div>
          </div>
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

      <ProjectTasksTable
        tasks={tasks}
        projectId={project.id}
        onNavigateToKanban={() => navigate(`/kanban?projectId=${project.id}`)}
      />

      <ProjectMemoriesSection memories={memories} />

      <ProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
      <PhaseDialog
        open={phaseDialogOpen}
        onOpenChange={setPhaseDialogOpen}
        projectId={project.id}
        phase={editingPhase}
      />
    </div>
  );
}
