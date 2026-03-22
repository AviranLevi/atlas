import {
  Bot,
  Zap,
  ScrollText,
  Brain,
  Columns3,
  Settings,
  Activity,
  FolderKanban,
} from 'lucide-react';
import type { NavItem } from './layout.types';

export const navItems: NavItem[] = [
  { to: '/kanban', icon: Columns3, label: 'Kanban' },
  { to: '/workspaces', icon: Activity, label: 'Workspaces', badge: true },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/skills', icon: Zap, label: 'Skills' },
  { to: '/rules', icon: ScrollText, label: 'Rules' },
  { to: '/memory', icon: Brain, label: 'Memory' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

/** Dynamic nav item for project context — requires active project ID */
export const projectContextNavItem: Omit<NavItem, 'to'> & { basePath: string } = {
  basePath: '/projects',
  icon: FolderKanban,
  label: 'Context',
};
