// React / library
import { PanelLeftClose } from 'lucide-react';
import { useMemo, useState } from 'react';

// Components
import { AtlasLogo } from '@/components/icons/AtlasLogo.icon';
import { HelpButton } from '@/components/onboarding/HelpButton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AgentStatusPanel } from '../agent-status-panel/AgentStatusPanel';
import { ProjectTabBar } from '../project-tab-bar/ProjectTabBar';
import { SidebarNavItem } from './SidebarNavItem';

// Context
import { useActiveProject } from '@/contexts/ProjectContext';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { AppShellProps } from './app-shell.types';

// Constants
import { navItems } from '../layout.constants';

export function AppShell({ children, mode }: AppShellProps) {
  const [expanded, setExpanded] = useState(true);
  const { activeProjectId } = useActiveProject();
  const slim = mode === 'noActiveProject';

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

  // In slim mode, only globalAlwaysOn entries render.
  const projectItems = slim ? [] : resolvedItems.filter((n) => n.section === 'project');
  const globalItems = slim
    ? resolvedItems.filter((n) => n.section === 'global' && n.globalAlwaysOn)
    : resolvedItems.filter((n) => n.section === 'global');

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
          {projectItems.length > 0 && (
            <>
              {expanded && (
                <span className="mb-1 mt-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Project
                </span>
              )}
              <div className="flex flex-col gap-0.5">
                {projectItems.map((item) => (
                  <SidebarNavItem key={item.label} item={item} expanded={expanded} />
                ))}
              </div>
            </>
          )}

          {globalItems.length > 0 && (
            <>
              {expanded ? (
                <span
                  className={cn(
                    'mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60',
                    projectItems.length > 0 ? 'mt-4' : 'mt-1',
                  )}
                >
                  Global
                </span>
              ) : projectItems.length > 0 ? (
                <div className="my-2 mx-2 h-px bg-border" />
              ) : null}
              <div className="flex flex-col gap-0.5">
                {globalItems.map((item) => (
                  <SidebarNavItem key={item.label} item={item} expanded={expanded} />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* AgentStatusPanel polls agent runs — only relevant when a project is active. */}
        {mode === 'activeProject' && <AgentStatusPanel expanded={expanded} />}

        {/* Help / onboarding access — always present so paused tours can be re-run. */}
        <div className={cn('shrink-0 border-t border-sidebar-border', expanded ? 'p-2' : 'flex justify-center p-2')}>
          <HelpButton expanded={expanded} />
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        {mode === 'activeProject' && <ProjectTabBar />}
        <main className="flex flex-1 flex-col overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
