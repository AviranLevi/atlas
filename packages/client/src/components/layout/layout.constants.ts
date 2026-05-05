// React / library
import {
  Activity,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Columns3,
  FolderKanban,
  FolderTree,
  GitBranch,
  Globe,
  MessageSquare,
  ScrollText,
  Settings,
  Store,
  Zap,
} from 'lucide-react';

// Lib
import { TOUR_TARGETS } from '@/lib/tours/tour-targets';

// Types
import type { NavItem } from './layout.types';

const MARKETPLACE_ENABLED = import.meta.env.VITE_ATLAS_MARKETPLACE_ENABLED === 'true';

/**
 * Sidebar navigation entries.
 *
 * Sections:
 *   - `project`: only rendered in `activeProject` mode (full sidebar). Hidden in slim mode.
 *   - `global`:  rendered in any authenticated mode, but only items with `globalAlwaysOn: true`
 *                appear in the slim sidebar (state B). Global items without that flag are
 *                still URL-reachable in state B (see `RouteGuard.PROJECT_AGNOSTIC_PATHS`) —
 *                they just don't get prime sidebar real estate when no project is active.
 */
const allNavItems: NavItem[] = [
  // ── Project-scoped ──
  { to: '/kanban', icon: Columns3, label: 'Kanban', section: 'project' },
  {
    to: '/workspaces',
    icon: Activity,
    label: 'Workspaces',
    section: 'project',
    dataTour: TOUR_TARGETS.navWorkspaces,
  },
  { to: '/pipelines', icon: GitBranch, label: 'Pipelines', section: 'project' },
  { to: '#', icon: FolderKanban, label: 'Context', section: 'project' },
  { to: '/chat', icon: MessageSquare, label: 'Chat', section: 'project' },
  { to: '/memory', icon: Brain, label: 'Memory', section: 'project' },
  { to: '/documents', icon: BookOpen, label: 'Documents', section: 'project' },

  // ── Global (always-on) ──
  { to: '/projects', icon: FolderTree, label: 'Projects', section: 'global', globalAlwaysOn: true },
  // Hidden from the slim sidebar in state B but still URL-reachable. These are global resource
  // libraries that don't earn prime real estate until a project is active.
  { to: '/agents', icon: Bot, label: 'Agents', section: 'global' },
  { to: '/skills', icon: Zap, label: 'Skills', section: 'global' },
  { to: '/rules', icon: ScrollText, label: 'Rules', section: 'global' },
  { to: '/global', icon: Globe, label: 'Global', section: 'global', globalAlwaysOn: true },
  { to: '/usage', icon: BarChart3, label: 'Usage', section: 'global', globalAlwaysOn: true },
  { to: '/marketplace', icon: Store, label: 'Marketplace', section: 'global', flag: 'marketplace' },
  { to: '/settings', icon: Settings, label: 'Settings', section: 'global', globalAlwaysOn: true },
];

export const navItems: NavItem[] = allNavItems.filter((item) => {
  if (item.flag === 'marketplace') return MARKETPLACE_ENABLED;
  return true;
});
