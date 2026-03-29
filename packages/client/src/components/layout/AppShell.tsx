// React / library
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PanelLeftClose } from 'lucide-react';

// Components
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AgentStatusPanel } from './AgentStatusPanel';
import { ProjectTabBar } from './ProjectTabBar';
import { AtlasLogo } from '@/components/icons/AtlasLogo.icon';
import { ActiveWorkspaceDot } from './ActiveWorkspaceDot';

// Contexts
import { useActiveProject } from '@/contexts/ProjectContext';

// Constants
import { navItems, projectContextNavItem } from './layout.constants';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const { activeProjectId } = useActiveProject();

  // Build nav items list — include "Context" only when a project is selected
  const allNavItems = activeProjectId
    ? [
        ...navItems.slice(0, 2), // Kanban, Workspaces
        {
          to: `${projectContextNavItem.basePath}/${activeProjectId}`,
          icon: projectContextNavItem.icon,
          label: projectContextNavItem.label,
        },
        ...navItems.slice(2), // Agents, Skills, Rules, Memory, Settings
      ]
    : navItems;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background transition-[width] duration-200',
          expanded ? 'w-[220px]' : 'w-14'
        )}
      >
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-sidebar-border px-3',
            expanded ? 'justify-between' : 'justify-center'
          )}
        >
          {expanded ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <AtlasLogo className="h-5 w-5 shrink-0 text-sidebar-foreground" />
                <span className="truncate text-sm font-semibold tracking-wide text-sidebar-foreground">
                  Atlas
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setExpanded(false)}
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Collapse sidebar</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setExpanded(true)}
                  aria-label="Expand sidebar"
                >
                  <AtlasLogo className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Atlas</TooltipContent>
            </Tooltip>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {allNavItems.map(({ to, icon: Icon, label, badge }) => {
            return (
              <Tooltip key={to} delayDuration={expanded ? 1000 : 0}>
                <TooltipTrigger asChild>
                  <div>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        cn(
                          'flex h-9 flex-row items-center rounded-md text-[13px] font-medium transition-colors',
                          expanded ? 'gap-3 px-3' : 'w-9 justify-center',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground'
                        )
                      }
                    >
                      <span className="relative shrink-0">
                        <Icon className="h-[18px] w-[18px]" />
                        {badge && <ActiveWorkspaceDot />}
                      </span>
                      {expanded && <span>{label}</span>}
                    </NavLink>
                  </div>
                </TooltipTrigger>
                {!expanded && (
                  <TooltipContent side="right">{label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>

        <AgentStatusPanel expanded={expanded} />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ProjectTabBar />
        <main className="flex flex-1 flex-col overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
