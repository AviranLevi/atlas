// React / library
import { GitBranch, Plus } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Components
import { ProjectCreateDialog } from '@/components/projects/ProjectCreateDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ActiveWorkspaceDot } from './ActiveWorkspaceDot';
import { TabButton } from './TabButton';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Hooks
import { useGitStatus } from '@/hooks/use-projects.hook';

export function ProjectTabBar() {
  const { activeProjectId, activeProject, projects, setActiveProjectId } = useActiveProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: gitStatus } = useGitStatus(activeProjectId ?? undefined, !!activeProject?.localPath);
  const currentBranch = gitStatus?.currentBranch ?? null;

  const handleTabClick = (id: string) => {
    setActiveProjectId(id);
    const projectDetailMatch = location.pathname.match(/^\/projects\/([^/]+)$/);
    if (projectDetailMatch) {
      navigate(`/projects/${id}`);
      return;
    }
    if (location.pathname.match(/^\/workspaces\/[^/]+$/)) {
      navigate('/workspaces');
    }
  };

  return (
    <>
      <div className="flex items-center border-b border-border bg-background/80 px-2 overflow-x-auto scrollbar-none">
        {projects.map((project) => (
          <TabButton
            key={project.id}
            active={activeProjectId === project.id}
            onClick={() => handleTabClick(project.id)}
            color={project.color}
            label={project.name}
            indicator={<ActiveWorkspaceDot projectId={project.id} />}
          />
        ))}

        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            New Project
          </TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        {currentBranch && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                <span className="max-w-[160px] truncate">{currentBranch}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {currentBranch !== activeProject?.defaultBranch
                ? `Currently on ${currentBranch} (default: ${activeProject?.defaultBranch ?? 'main'})`
                : `On default branch`}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <ProjectCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(p) => {
          setActiveProjectId(p.id);
          navigate(`/projects/${p.id}`);
        }}
      />
    </>
  );
}
