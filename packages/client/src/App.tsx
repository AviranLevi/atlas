// Components
import { AppShell } from '@/components/layout/AppShell';
import { ThemedToaster } from '@/components/layout/ThemedToaster';
import { WorkspaceNotifications } from '@/components/layout/WorkspaceNotifications';
import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';

export function App() {
  return (
    <AppProviders>
      <AppShell>
        <WorkspaceNotifications />
        <AppRoutes />
      </AppShell>
      <ThemedToaster />
    </AppProviders>
  );
}
