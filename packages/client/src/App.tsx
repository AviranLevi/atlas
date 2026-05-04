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

  if (mode === 'firstRun') {
    return (
      <>
        <BootstrapNotifications />
        <RouteGuard>
          <AppRoutes />
        </RouteGuard>
      </>
    );
  }

  return (
    <AppShell mode={mode}>
      <BootstrapNotifications />
      <WorkspaceNotifications />
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
