// React / library
import { useEffect } from 'react';
import { toast } from 'sonner';

// Hooks
import { useShellMode } from './use-shell-mode.hook';

const SEEN_KEY = 'atlas_seen_state_b_v1';

/**
 * Fires a one-time onboarding toast the first time the user lands on state B
 * (authenticated, has projects, none active). Persists across reloads via `localStorage`.
 */
export function useFirstTimeStateBToast() {
  const { mode, isReady } = useShellMode();

  useEffect(() => {
    if (!isReady) return;
    if (mode !== 'noActiveProject') return;

    try {
      if (window.localStorage.getItem(SEEN_KEY) === '1') return;
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Ignore storage failures — the toast just shows again next session.
    }

    toast.info('Pick a project to open its workspace, or create a new one.', {
      duration: 5000,
    });
  }, [mode, isReady]);
}
