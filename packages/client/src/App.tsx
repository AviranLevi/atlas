// Components
import { AppShell, RouteGuard, ThemedToaster, WorkspaceNotifications } from '@/components/layout';
import { BootstrapNotifications } from '@/components/onboarding/BootstrapNotifications';
import { TourDebugOverlay } from '@/components/onboarding/TourDebugOverlay';

// Hooks
import { useFirstTimeStateBToast } from '@/hooks/use-first-time-toast.hook';
import { usePageTour } from '@/hooks/use-page-tour.hook';
import { useShellMode } from '@/hooks/use-shell-mode.hook';

import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';

function ShellSwitcher() {
  const { mode } = useShellMode();
  useFirstTimeStateBToast();
  usePageTour();

  // Always render through AppShell so the component tree is stable across mode
  // transitions. Previously, firstRun used a bare Fragment while other modes
  // used <AppShell>, causing React to unmount the entire child tree (including
  // page-level state like the WelcomePage stepper) whenever mode changed.
  return (
    <AppShell mode={mode}>
      <BootstrapNotifications />
      {mode !== 'firstRun' && <WorkspaceNotifications />}
      <RouteGuard>
        <AppRoutes />
      </RouteGuard>
    </AppShell>
  );
}

export function App() {
  return (
    <AppProviders>
      <ShellSwitcher />
      <TourDebugOverlay />
      <ThemedToaster />
    </AppProviders>
  );
}
