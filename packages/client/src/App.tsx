// Components
import { AppProviders } from './AppProviders';
import { AppShell } from '@/components/layout/AppShell';
import { AppRoutes } from './AppRoutes';
import { ThemedToaster } from '@/components/layout/ThemedToaster';
import { WorkspaceNotifications } from '@/components/layout/WorkspaceNotifications';

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
