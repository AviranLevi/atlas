// React / library
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Components
import { ProjectCreateDialog } from '@/components/projects/ProjectCreateDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ActiveWorkspaceDot } from './ActiveWorkspaceDot';
import { BranchSwitcher } from './BranchSwitcher';
import { TabButton } from './TabButton';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

export function ProjectTabBar() {
  const { activeProjectId, activeProject, projects, setActiveProjectId } = useActiveProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);

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

        {activeProject?.localPath && <BranchSwitcher project={activeProject} />}
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
