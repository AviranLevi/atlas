// FILE_PATH: packages/client/src/hooks/use-page-tour.hook.ts

// React / library
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

// Hooks
import { useShellMode } from './use-shell-mode.hook';
import { useTourState, useTourStateMutations } from './use-tour-state.hook';

// Lib
import { startTour } from '@/lib/tours/tour-engine';
import { isTourActive } from '@/lib/tours/tour-lock';
import { loadTourForRoute } from '@/lib/tours/tour-registry';

// Types
import type { TourDefinition } from '@/lib/tours/tour-types';

const ROUTE_DEBOUNCE_MS = 300;

/**
 * Mounted once at the root of the app. Watches `location.pathname`, debounces
 * by 300ms, then evaluates whether to autostart a tour.
 *
 * No-fire conditions (plan §5):
 *   - shell mode is `firstRun` (user hasn't even configured an API key yet)
 *   - tours are globally paused (`tours_paused = true`)
 *   - any modal-like element is open: `[role="dialog"][data-state="open"]`
 *   - window doesn't have focus (e.g. user tabbed away)
 *   - a tour is already active (global lock)
 *   - prerequisites for the tour fail
 *   - the tour has been completed, or was dismissed within the past 7 days
 *
 * NOTE: `prefers-reduced-motion` is intentionally NOT a no-fire condition.
 * The engine disables animations but autostart still runs (plan §11).
 */
export function usePageTour() {
  const location = useLocation();
  const { mode } = useShellMode();
  const tourState = useTourState();
  const { markCompleted, markDismissed, pauseTours } = useTourStateMutations();

  // Read the latest state inside the timer without re-subscribing to React.
  const stateRef = useRef(tourState);
  stateRef.current = tourState;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const writersRef = useRef({ markCompleted, markDismissed, pauseTours });
  writersRef.current = { markCompleted, markDismissed, pauseTours };

  useEffect(() => {
    if (modeRef.current === 'firstRun') return;
    if (stateRef.current.isLoading) return;
    if (stateRef.current.toursPaused) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      void evaluateAndFire(location.pathname);
    }, ROUTE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };

    async function evaluateAndFire(pathname: string) {
      // Re-check side conditions at fire-time (state may have changed during debounce).
      if (modeRef.current === 'firstRun') return;
      if (stateRef.current.toursPaused) return;
      if (isTourActive()) return;
      if (anyModalOpen()) return;
      if (typeof document !== 'undefined' && !document.hasFocus()) return;

      let def: TourDefinition | null = null;
      try {
        def = await loadTourForRoute(pathname);
      } catch {
        return;
      }
      if (!def) return;

      if (cancelled || pathname !== location.pathname) return;
      if (stateRef.current.isCompleted(def.id)) return;
      if (stateRef.current.isSnoozed(def.id)) return;
      if (def.prerequisites && !def.prerequisites()) return;

      // Re-check critical guards one more time after the await.
      if (isTourActive()) return;
      if (anyModalOpen()) return;
      if (typeof document !== 'undefined' && !document.hasFocus()) return;

      const result = await startTour(def);

      if (result.outcome === 'completed') {
        await writersRef.current.markCompleted(def.id);
      } else if (result.outcome === 'skipped') {
        const globalCount = await writersRef.current.markDismissed(def.id);
        if (globalCount >= stateRef.current.fatigueThreshold) {
          await writersRef.current.pauseTours();
          toast.info("We'll stop interrupting", {
            description: 'Tours are paused. Re-enable from Settings → Onboarding.',
          });
        }
      }
    }
  }, [location.pathname]);
}

function anyModalOpen(): boolean {
  if (typeof document === 'undefined') return false;
  return document.querySelector('[role="dialog"][data-state="open"]') !== null;
}
