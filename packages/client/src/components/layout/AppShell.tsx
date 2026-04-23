// React / library
import { PanelLeftClose } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';

// Components
import { AtlasLogo } from '@/components/icons/AtlasLogo.icon';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ActiveWorkspaceDot } from './ActiveWorkspaceDot';
import { AgentStatusPanel } from './AgentStatusPanel';
import { ProjectTabBar } from './ProjectTabBar';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { NavItem } from './layout.types';

// Constants
import { navItems } from './layout.constants';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const { activeProjectId } = useActiveProject();

  const resolvedItems = useMemo(() => {
    return navItems.map((item) => {
      if (item.label === 'Context') {
        return activeProjectId
          ? { ...item, to: `/projects/${activeProjectId}`, disabled: false }
          : { ...item, disabled: true };
      }
      return item;
    });
  }, [activeProjectId]);

  const projectItems = resolvedItems.filter((n) => n.section === 'project');
  const globalItems = resolvedItems.filter((n) => n.section === 'global');

  function renderNavItem(item: NavItem) {
    const { to, icon: Icon, label, badge, disabled } = item;

    if (disabled) {
      return (
        <Tooltip key={label} delayDuration={expanded ? 1000 : 0}>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'flex h-9 flex-row items-center rounded-md text-[13px] font-medium opacity-40 cursor-default',
                expanded ? 'gap-3 px-3' : 'w-9 justify-center',
              )}
            >
              <span className="relative shrink-0">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              {expanded && <span>{label}</span>}
            </span>
          </TooltipTrigger>
          <TooltipContent side="right">Select a project to view its context</TooltipContent>
        </Tooltip>
      );
    }

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
                    : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground',
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
        {!expanded && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={cn(
          'sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background transition-[width] duration-200',
          expanded ? 'w-[220px]' : 'w-14',
        )}
      >
        <div
          className={cn(
            'flex h-14 shrink-0 items-center border-b border-sidebar-border px-3',
            expanded ? 'justify-between' : 'justify-center',
          )}
        >
          {expanded ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <AtlasLogo className="h-5 w-5 shrink-0 text-sidebar-foreground" />
                <span className="truncate text-sm font-medium tracking-tight text-sidebar-foreground">Atlas</span>
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

        <nav className="flex flex-1 flex-col overflow-y-auto p-2">
          {expanded && (
            <span className="mb-1 mt-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Project
            </span>
          )}
          <div className="flex flex-col gap-0.5">{projectItems.map(renderNavItem)}</div>

          {expanded ? (
            <span className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Global
            </span>
          ) : (
            <div className="my-2 mx-2 h-px bg-border" />
          )}
          <div className="flex flex-col gap-0.5">{globalItems.map(renderNavItem)}</div>
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
