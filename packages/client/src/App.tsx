// Components
import { AppShell } from '@/components/layout/AppShell';
import { RouteGuard } from '@/components/layout/RouteGuard';
import { ThemedToaster } from '@/components/layout/ThemedToaster';
import { WorkspaceNotifications } from '@/components/layout/WorkspaceNotifications';

// Hooks
import { useFirstTimeStateBToast } from '@/hooks/use-first-time-toast.hook';
import { useShellMode } from '@/hooks/use-shell-mode.hook';

import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';

function ShellSwitcher() {
  const { mode } = useShellMode();
  useFirstTimeStateBToast();

  if (mode === 'firstRun') {
    return (
      <RouteGuard>
        <AppRoutes />
      </RouteGuard>
    );
  }

  return (
    <AppShell mode={mode}>
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
      <ThemedToaster />
    </AppProviders>
  );
}
