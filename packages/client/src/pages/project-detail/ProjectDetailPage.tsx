// React / library
import { ArrowLeft } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { Button } from '@/components/ui/button';
import { ProjectAgentsSection } from './ProjectAgentsSection';
import { ProjectBriefSection } from './ProjectBriefSection';
import { ProjectDesignContextSection } from './ProjectDesignContextSection';
import { ProjectHeader } from './ProjectHeader';
import { ProjectMemoriesSection } from './ProjectMemoriesSection';
import { ProjectPhasesSection } from './ProjectPhasesSection';
import { ProjectScanSection } from './ProjectScanSection';
import { ProjectStatsRow } from './ProjectStatsRow';
import { ProjectTasksTable } from './ProjectTasksTable';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useProjectAgents, useAssignAgent, useUnassignAgent } from '@/hooks/use-project-agents.hook';
import { useProjectContext, useScanProject, useGenerateBrief } from '@/hooks/use-projects.hook';

// Types
import type { ProjectStatus } from '@atlas/shared';

// Constants
import { statusConfig, UI_PROJECT_TYPES } from './project-detail-page.constants';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ctx, isLoading } = useProjectContext(id);
  const scanProject = useScanProject();
  const generateBrief = useGenerateBrief();
  const [editOpen, setEditOpen] = useState(false);
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

  // Show design context only for projects with a UI surface, or if one is already set
  const showDesignContext = UI_PROJECT_TYPES.has(project.scanData?.projectType ?? '') || !!project.designContext;

  return (
    <div className="flex flex-col gap-8">
      <ProjectHeader
        project={project}
        statusConfig={status}
        scanProject={scanProject}
        onEdit={() => setEditOpen(true)}
      />

      <ProjectScanSection project={project} scanProject={scanProject} />

      <ProjectBriefSection project={project} generateBrief={generateBrief} />

      {showDesignContext && <ProjectDesignContextSection project={project} />}

      <ProjectStatsRow tasks={tasks} />

      <ProjectAgentsSection
        projectId={project.id}
        projectAgents={projectAgents}
        unassignedAgents={unassignedAgents}
        assignPopoverOpen={assignPopoverOpen}
        onAssignPopoverOpenChange={setAssignPopoverOpen}
        onAssign={(agentId) => assignAgent.mutate({ projectId: project.id, agentId })}
        onUnassign={(agentId) => unassignAgent.mutate({ projectId: project.id, agentId })}
      />

      <ProjectPhasesSection projectId={project.id} />

      <ProjectTasksTable
        tasks={tasks}
        projectId={project.id}
        onNavigateToKanban={() => navigate(`/kanban?projectId=${project.id}`)}
      />

      <ProjectMemoriesSection memories={memories} />

      <ProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
    </div>
  );
}
