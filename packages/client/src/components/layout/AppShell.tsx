import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bot,
  Zap,
  ScrollText,
  Brain,
  FolderOpen,
  Columns3,
  Settings,
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

const navItems = [
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/skills', icon: Zap, label: 'Skills' },
  { to: '/rules', icon: ScrollText, label: 'Rules' },
  { to: '/memory', icon: Brain, label: 'Memory' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/kanban', icon: Columns3, label: 'Kanban' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          'flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar-background transition-[width] duration-200',
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

        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {navItems.map(({ to, icon: Icon, label }) => (
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
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {expanded && <span>{label}</span>}
                  </NavLink>
                </div>
              </TooltipTrigger>
              {!expanded && (
                <TooltipContent side="right">{label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
