import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layers, Plus, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveProject } from '@/contexts/ProjectContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProjectDialog } from '@/components/projects/ProjectDialog';

export function ProjectTabBar() {
  const { activeProjectId, activeProject, projects, setActiveProjectId } = useActiveProject();
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);

  const handleTabClick = (id: string | null) => {
    setActiveProjectId(id);
    // If currently viewing a project detail page, navigate to the new project's detail page
    const projectDetailMatch = location.pathname.match(/^\/projects\/([^/]+)$/);
    if (projectDetailMatch && id) {
      navigate(`/projects/${id}`);
    }
  };

  // Always render the bar (even with 0 projects — so user can create one)
  return (
    <>
      <div className="flex items-center border-b border-border bg-background/80 px-2 overflow-x-auto scrollbar-none">
        {/* All Projects tab */}
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

        {/* Project tabs */}
        {projects.map((project) => (
          <TabButton
            key={project.id}
            active={activeProjectId === project.id}
            onClick={() => handleTabClick(project.id)}
            color={project.color}
            label={project.name}
          />
        ))}

        {/* Add project button */}
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Manage projects link */}
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

function TabButton({
  active,
  onClick,
  color,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  color: string | null;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <Tooltip delayDuration={500}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            'relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors',
            'hover:text-foreground',
            active
              ? 'text-foreground'
              : 'text-muted-foreground hover:bg-accent/50',
          )}
        >
          {icon || (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: color ?? '#64748b' }}
            />
          )}
          <span className="max-w-[120px] truncate">{label}</span>
          {active && (
            <span
              className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-primary"
            />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
