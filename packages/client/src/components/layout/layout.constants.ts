import {
  Bot,
  Zap,
  ScrollText,
  Brain,
  FolderOpen,
  Columns3,
  Settings,
  Activity,
} from 'lucide-react';
import type { NavItem } from './layout.types';

export const navItems: NavItem[] = [
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/skills', icon: Zap, label: 'Skills' },
  { to: '/rules', icon: ScrollText, label: 'Rules' },
  { to: '/memory', icon: Brain, label: 'Memory' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/kanban', icon: Columns3, label: 'Kanban' },
  { to: '/workspaces', icon: Activity, label: 'Workspaces', badge: true },
  { to: '/settings', icon: Settings, label: 'Settings' },
];
