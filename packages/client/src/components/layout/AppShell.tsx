import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/use-theme.hook';
import { useWorkspaces } from '@/hooks/use-workspaces.hook';
import { useActiveProject } from '@/contexts/ProjectContext';
import { navItems, projectContextNavItem } from './layout.constants';
import { AgentStatusPanel } from './AgentStatusPanel';
import { ProjectTabBar } from './ProjectTabBar';

function ActiveWorkspaceDot() {
  const { data: workspaces = [] } = useWorkspaces();
  const activeCount = workspaces.filter(
    (w) => w.status === 'running' || w.status === 'pending'
  ).length;
  if (activeCount === 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
      {activeCount}
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const { theme, toggleTheme } = useTheme();
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
    <div className="flex min-h-screen">
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
          {expanded && (
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              Agents Manager
            </span>
          )}
          <div className="flex shrink-0 items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setExpanded((p) => !p)}
                  aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                  {expanded ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeftOpen className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {expanded ? 'Collapse sidebar' : 'Expand sidebar'}
              </TooltipContent>
            </Tooltip>
          </div>
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
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
