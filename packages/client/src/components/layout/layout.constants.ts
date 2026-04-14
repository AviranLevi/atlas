// React / library
import {
  Activity,
  BarChart3,
  BookOpen,
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
  // ── Project-scoped ──
  { to: '/kanban', icon: Columns3, label: 'Kanban', section: 'project' },
  { to: '/workspaces', icon: Activity, label: 'Workspaces', badge: true, section: 'project' },
  { to: '#', icon: FolderKanban, label: 'Context', section: 'project' },
  { to: '/chat', icon: MessageSquare, label: 'Chat', section: 'project' },
  { to: '/memory', icon: Brain, label: 'Memory', section: 'project' },
  { to: '/documents', icon: BookOpen, label: 'Documents', section: 'project' },

  // ── Global ──
  { to: '/agents', icon: Bot, label: 'Agents', section: 'global' },
  { to: '/skills', icon: Zap, label: 'Skills', section: 'global' },
  { to: '/rules', icon: ScrollText, label: 'Rules', section: 'global' },
  { to: '/global', icon: Globe, label: 'Global', section: 'global' },
  { to: '/usage', icon: BarChart3, label: 'Usage', section: 'global' },
  { to: '/marketplace', icon: Store, label: 'Marketplace', section: 'global' },
  { to: '/settings', icon: Settings, label: 'Settings', section: 'global' },
];
