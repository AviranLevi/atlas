// Types
import type { NavItem, ShellMode } from '../layout.types';

export type AppShellProps = {
  children: React.ReactNode;
  /** When 'noActiveProject', renders a slim sidebar with only globalAlwaysOn entries. */
  mode: ShellMode;
};

export type SidebarNavItemProps = {
  item: NavItem;
  expanded: boolean;
};
