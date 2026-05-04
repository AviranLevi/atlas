// Types
import type { ExecutorStatus } from '@atlas/shared';

export type NavItem = {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: boolean;
  section: 'project' | 'global';
  /** When true, renders as a muted span instead of a NavLink */
  disabled?: boolean;
  /** Optional feature flag — entry hidden unless the matching env flag is enabled */
  flag?: 'marketplace';
  /**
   * When true, this item still renders in the slim "no active project" sidebar (state B).
   * Project-scoped items never render in slim mode.
   */
  globalAlwaysOn?: boolean;
  /** Optional `data-tour` selector — wired through to the rendered NavLink for tour anchoring. */
  dataTour?: string;
};

/**
 * The current shell rendering mode, derived from auth + active project state.
 *
 *  - `firstRun`: no API key OR no projects → full-bleed onboarding, no shell chrome
 *  - `noActiveProject`: authenticated with projects but none selected → slim global sidebar
 *  - `activeProject`: authenticated with an active project → full shell + project tab bar
 */
export type ShellMode = 'firstRun' | 'noActiveProject' | 'activeProject';

export type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export type AgentStatusPanelProps = {
  expanded: boolean;
};

export type ExecutorPopoverProps = {
  executor: ExecutorStatus;
  onRecheck: () => void;
  isRechecking: boolean;
};

export type CopyCommandProps = {
  label: string;
  command: string;
};

export type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  color: string | null;
  label: string;
  icon?: React.ReactNode;
  indicator?: React.ReactNode;
};
