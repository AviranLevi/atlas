// Context
import { useAuth } from '@/contexts/auth.context';
import { useActiveProject } from '@/contexts/ProjectContext';

// Types
import type { ShellMode } from '@/components/layout/layout.types';

const NEW_SHELL_FLAG = import.meta.env.VITE_ATLAS_NEW_SHELL;

/**
 * Optional rollout flag — when set to `false` keeps the legacy "always full shell" mode so
 * the new state machine can be disabled in emergencies. Defaults to enabled.
 */
function isNewShellEnabled(): boolean {
  if (NEW_SHELL_FLAG === undefined) return true;
  return NEW_SHELL_FLAG !== 'false';
}

export type ShellModeResult = {
  mode: ShellMode;
  /** True once both auth + (when authenticated) project loading has settled. */
  isReady: boolean;
};

export type ShellModeInputs = {
  isAuthenticated: boolean;
  projectsLoading: boolean;
  projectCount: number;
  hasActiveProject: boolean;
  newShellEnabled?: boolean;
};

/**
 * Pure decision table — exposed for unit tests so the entire UX state machine can be
 * exercised without rendering React.
 *
 *  - State A `firstRun` — no API key, OR authenticated but zero projects exist
 *  - State B `noActiveProject` — authenticated, projects exist, none selected
 *  - State C `activeProject` — authenticated with an active project resolved
 */
export function resolveShellMode(input: ShellModeInputs): ShellModeResult {
  const newShell = input.newShellEnabled ?? true;
  if (!newShell) return { mode: 'activeProject', isReady: true };

  if (!input.isAuthenticated) return { mode: 'firstRun', isReady: true };
  if (input.projectsLoading) return { mode: 'firstRun', isReady: false };
  if (input.projectCount === 0) return { mode: 'firstRun', isReady: true };
  if (!input.hasActiveProject) return { mode: 'noActiveProject', isReady: true };
  return { mode: 'activeProject', isReady: true };
}

/** Hook wrapper around `resolveShellMode` that reads from auth + project contexts. */
export function useShellMode(): ShellModeResult {
  const { isAuthenticated } = useAuth();
  const { activeProjectId, projects, isLoading } = useActiveProject();

  return resolveShellMode({
    isAuthenticated,
    projectsLoading: isLoading,
    projectCount: projects.length,
    hasActiveProject: !!activeProjectId,
    newShellEnabled: isNewShellEnabled(),
  });
}
