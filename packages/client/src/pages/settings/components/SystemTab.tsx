// Components
import { DataManagementTab } from './DataManagementTab';
import { ServerInfoTab } from './ServerInfoTab';

// Hooks
import { useSystemInfo } from '@/hooks/use-system.hook';

const LINK_CLASS = 'inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline';

export function SystemTab() {
  const { data: systemInfo } = useSystemInfo();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Server</h3>
        <p className="text-sm text-muted-foreground mt-1">Runtime information about this Atlas instance.</p>
      </div>
      <ServerInfoTab />

      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold mb-1">Data Management</h3>
        <p className="text-sm text-muted-foreground mb-4">Export or reset your local database.</p>
        <DataManagementTab />
      </div>

      <div className="border-t pt-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Atlas</p>
          <p className="font-mono text-xs text-muted-foreground">v{systemInfo?.version ?? '—'}</p>
        </div>
        <div className="flex gap-6">
          <a
            href="https://github.com/AviranLevi/atlas"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            GitHub
          </a>
          <a
            href="https://github.com/AviranLevi/atlas#readme"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            Docs
          </a>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Licensed under the MIT License.</p>
    </div>
  );
}
