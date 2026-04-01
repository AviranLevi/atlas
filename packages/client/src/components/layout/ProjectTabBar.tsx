// React / library
import { Layers, Plus, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Components
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TabButton } from './TabButton';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

export function ProjectTabBar() {
  const { activeProjectId, projects, setActiveProjectId } = useActiveProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);

  const handleTabClick = (id: string | null) => {
    setActiveProjectId(id);
    const projectDetailMatch = location.pathname.match(/^\/projects\/([^/]+)$/);
    if (projectDetailMatch && id) {
      navigate(`/projects/${id}`);
    }
  };

  return (
    <>
      <div className="flex items-center border-b border-border bg-background/80 px-2 overflow-x-auto scrollbar-none">
        {projects.length > 1 && (
          <>
            <TabButton
              active={activeProjectId === null}
              onClick={() => handleTabClick(null)}
              color={null}
              label="All Projects"
              icon={<Layers className="h-3 w-3" />}
            />
            <div className="mx-1 h-4 w-px bg-border" />
          </>
        )}

        {projects.map((project) => (
          <TabButton
            key={project.id}
            active={activeProjectId === project.id}
            onClick={() => handleTabClick(project.id)}
            color={project.color}
            label={project.name}
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

        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Manage Projects
          </TooltipContent>
        </Tooltip>
      </div>

      <ProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
