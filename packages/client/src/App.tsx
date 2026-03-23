// Components
import { AppProviders } from './AppProviders';
import { AppShell } from '@/components/layout/AppShell';
import { AppRoutes } from './AppRoutes';

export function App() {
  return (
    <AppProviders>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </AppProviders>
  );
}
