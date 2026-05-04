// React / library
import { NavLink } from 'react-router-dom';

// Components
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Lib
import { cn } from '@/lib/utils';

// Types
import type { SidebarNavItemProps } from './app-shell.types';

export function SidebarNavItem({ item, expanded }: SidebarNavItemProps) {
  const { to, icon: Icon, label, disabled, dataTour } = item;

  if (disabled) {
    return (
      <Tooltip delayDuration={expanded ? 1000 : 0}>
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
    <Tooltip delayDuration={expanded ? 1000 : 0}>
      <TooltipTrigger asChild>
        <div>
          <NavLink
            to={to}
            data-tour={dataTour}
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
            </span>
            {expanded && <span>{label}</span>}
          </NavLink>
        </div>
      </TooltipTrigger>
      {!expanded && <TooltipContent side="right">{label}</TooltipContent>}
    </Tooltip>
  );
}
