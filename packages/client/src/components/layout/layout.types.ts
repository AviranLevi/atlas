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
  /**
   * When true, renders a pulsing dot on the icon when there are active chat streams.
   * Reads from ChatStreamContext — only meaningful for the Chat nav item.
   */
  streamingIndicator?: boolean;
};

/**
 * The current shell rendering mode, derived from auth + active project state.
 *
 *  - `firstRun`: no API key OR no projects → full-bleed onboarding, no shell chrome
 *  - `noActiveProject`: authenticated with projects but none selected → slim global sidebar
 *  - `activeProject`: authenticated with an active project → full shell + project tab bar
 */
export type ShellMode = 'firstRun' | 'noActiveProject' | 'activeProject';
