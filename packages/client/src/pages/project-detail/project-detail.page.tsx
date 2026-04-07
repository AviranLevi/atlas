// React / library
import { ArrowLeft, LayoutList, Network } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { Button } from '@/components/ui/button';
import { ProjectAgentsSection } from './components/ProjectAgentsSection';
import { ProjectBriefSection } from './components/ProjectBriefSection';
import { ProjectDesignContextSection } from './components/ProjectDesignContextSection';
import { ProjectHeader } from './components/ProjectHeader';
import { ProjectKnowledgeGraph } from './components/ProjectKnowledgeGraph';
import { ProjectMemoriesSection } from './components/ProjectMemoriesSection';
import { ProjectPhasesSection } from './components/ProjectPhasesSection';
import { ProjectScanSection } from './components/ProjectScanSection';
import { ProjectStatsRow } from './components/ProjectStatsRow';
import { ProjectTasksTable } from './components/ProjectTasksTable';

// Hooks
import { useAgents } from '@/hooks/use-agents.hook';
import { useProjectAgents, useAssignAgent, useUnassignAgent } from '@/hooks/use-project-agents.hook';
import { useProjectContext, useScanProject, useGenerateBrief } from '@/hooks/use-projects.hook';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { ProjectStatus } from '@atlas/shared';

// Constants
import { statusConfig, UI_PROJECT_TYPES } from './project-detail.constants';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: ctx, isLoading } = useProjectContext(id);
  const scanProject = useScanProject();
  const generateBrief = useGenerateBrief();
  const [editOpen, setEditOpen] = useState(false);
  const [assignPopoverOpen, setAssignPopoverOpen] = useState(false);
  const [view, setView] = useState<'overview' | 'graph'>('overview');

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

      {/* View toggle */}
      <div className="flex justify-end -mt-4">
        <div className="flex divide-x overflow-hidden rounded-lg border">
          <button
            type="button"
            onClick={() => setView('overview')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
              view === 'overview'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Overview
          </button>
          <button
            type="button"
            onClick={() => setView('graph')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
              view === 'graph' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Network className="h-3.5 w-3.5" />
            Graph
          </button>
        </div>
      </div>

      {view === 'graph' ? (
        <ProjectKnowledgeGraph project={project} />
      ) : (
        <>
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
        </>
      )}

      <ProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
    </div>
  );
}
