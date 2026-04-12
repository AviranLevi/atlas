// React / library
import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  Columns3,
  FolderKanban,
  Globe,
  MessageSquare,
  ScrollText,
  Settings,
  Store,
  Zap,
} from 'lucide-react';

// Types
import type { NavItem } from './layout.types';

export const navItems: NavItem[] = [
  { to: '/kanban', icon: Columns3, label: 'Kanban' },
  { to: '/workspaces', icon: Activity, label: 'Workspaces', badge: true },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/skills', icon: Zap, label: 'Skills' },
  { to: '/rules', icon: ScrollText, label: 'Rules' },
  { to: '/memory', icon: Brain, label: 'Memory' },
  { to: '/global', icon: Globe, label: 'Global' },
  { to: '/usage', icon: BarChart3, label: 'Usage' },
  { to: '/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

/** Dynamic nav item for project context — requires active project ID */
export const projectContextNavItem: Omit<NavItem, 'to'> & { basePath: string } = {
  basePath: '/projects',
  icon: FolderKanban,
  label: 'Context',
};
